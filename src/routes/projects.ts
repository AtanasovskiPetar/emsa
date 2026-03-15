import { and, eq, inArray } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, projectSchema, updateProjectSchema } from "@/constants/schemas";
import { pillars, projectImages, projects } from "@/db/schema";
import { db } from "@/lib/db";
import { type BunRequest, HttpError, parseBody, withRole } from "@/lib/middleware";
import { deleteS3Object, getPresignedUploadUrl } from "@/lib/s3";

// Public
const getProjects = async () => {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      startingAt: projects.startingAt,
      pillarId: projects.pillarId,
      pillarName: pillars.name,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .orderBy(projects.startingAt);

  const allImages = await db
    .select({ projectId: projectImages.projectId, url: projectImages.url })
    .from(projectImages)
    .orderBy(projectImages.order);

  const imagesByProject = allImages.reduce<Record<string, string[]>>((acc, img) => {
    (acc[img.projectId] ??= []).push(img.url);
    return acc;
  }, {});

  return Response.json(rows.map((p) => ({ ...p, images: imagesByProject[p.id] ?? [] })));
};

const getProjectById = async (req: BunRequest<{ id: string }>) => {
  const { id } = req.params;

  const [row] = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      startingAt: projects.startingAt,
      pillarId: projects.pillarId,
      pillarName: pillars.name,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const images = await db
    .select({ url: projectImages.url })
    .from(projectImages)
    .where(eq(projectImages.projectId, id))
    .orderBy(projectImages.order);

  return Response.json({ ...row, images: images.map((i) => i.url) });
};

// Admin
const getProjectsAdmin = withRole(Role.ADMIN, async () => {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      startingAt: projects.startingAt,
      pillarId: projects.pillarId,
      pillarName: pillars.name,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .orderBy(projects.startingAt);

  const allImages = await db
    .select({ projectId: projectImages.projectId, url: projectImages.url })
    .from(projectImages)
    .orderBy(projectImages.order);

  const imagesByProject = allImages.reduce<Record<string, string[]>>((acc, img) => {
    (acc[img.projectId] ??= []).push(img.url);
    return acc;
  }, {});

  return Response.json(rows.map((p) => ({ ...p, images: imagesByProject[p.id] ?? [] })));
});

const createProject = withRole(Role.ADMIN, async (req) => {
  const { imageUrls, startingAt, ...rest } = await parseBody(req, projectSchema);

  const project = await db.transaction(async (tx) => {
    const [newProject] = await tx
      .insert(projects)
      .values({ ...rest, startingAt: new Date(startingAt) })
      .returning();

    if (!newProject) throw new HttpError(500, "Failed to create project");

    if (imageUrls.length > 0) {
      await tx
        .insert(projectImages)
        .values(imageUrls.map((url, i) => ({ projectId: newProject.id, url, order: i })));
    }

    return newProject;
  });

  return Response.json(project, { status: 201 });
});

const updateProject = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;
  const { imageUrls, startingAt, ...rest } = await parseBody(req, updateProjectSchema);

  let imagesToDeleteFromS3: { url: string }[] = [];

  const updated = await db.transaction(async (tx) => {
    const [project] = await tx
      .update(projects)
      .set({
        ...rest,
        ...(startingAt !== undefined && { startingAt: new Date(startingAt) }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    if (!project) throw new HttpError(404, "Project not found");

    if (imageUrls !== undefined) {
      const existingImages = await tx
        .select({ id: projectImages.id, url: projectImages.url })
        .from(projectImages)
        .where(eq(projectImages.projectId, id));

      const existingByUrl = new Map(existingImages.map((img) => [img.url, img]));
      const newUrlOrder = new Map(imageUrls.map((url, i) => [url, i]));

      const toDelete = existingImages.filter((img) => !newUrlOrder.has(img.url));
      const toInsert = imageUrls.filter((url) => !existingByUrl.has(url));

      if (toDelete.length > 0) {
        await tx.delete(projectImages).where(
          and(
            eq(projectImages.projectId, id),
            inArray(
              projectImages.id,
              toDelete.map((img) => img.id)
            )
          )
        );
        imagesToDeleteFromS3 = toDelete;
      }

      if (toInsert.length > 0) {
        await tx
          .insert(projectImages)
          .values(toInsert.map((url) => ({ projectId: id, url, order: newUrlOrder.get(url)! })));
      }

      const toUpdateOrder = existingImages.filter((img) => newUrlOrder.has(img.url));
      await Promise.all(
        toUpdateOrder.map((img) =>
          tx
            .update(projectImages)
            .set({ order: newUrlOrder.get(img.url)! })
            .where(and(eq(projectImages.projectId, id), eq(projectImages.id, img.id)))
        )
      );
    }

    return project;
  });

  await Promise.all(
    imagesToDeleteFromS3.map((img) => deleteS3Object(img.url).catch(console.error))
  );

  return Response.json(updated);
});

const deleteProject = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;

  const { deleted, images } = await db.transaction(async (tx) => {
    const projectImages_ = await tx
      .select({ url: projectImages.url })
      .from(projectImages)
      .where(eq(projectImages.projectId, id));

    const [deletedProject] = await tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    return { deleted: deletedProject, images: projectImages_ };
  });

  if (!deleted) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  await Promise.all(images.map((img) => deleteS3Object(img.url).catch(console.error)));

  return Response.json({ success: true });
});

const getProjectUploadUrl = withRole(Role.ADMIN, async (req) => {
  const contentType = new URL(req.url).searchParams.get("contentType") ?? "image/jpeg";

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const key = `project-images/${crypto.randomUUID()}.${ext}`;
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);

  return Response.json({ uploadUrl, fileUrl, key });
});

export const projectRoutes = {
  [ApiRoutes.PROJECTS]: { GET: getProjects },
  [ApiRoutes.PROJECT_BY_ID]: { GET: getProjectById },
  [ApiRoutes.ADMIN_PROJECTS_UPLOAD]: { GET: getProjectUploadUrl },
  [ApiRoutes.ADMIN_PROJECTS]: { GET: getProjectsAdmin, POST: createProject },
  [ApiRoutes.ADMIN_PROJECT_BY_ID]: { PATCH: updateProject, DELETE: deleteProject },
};
