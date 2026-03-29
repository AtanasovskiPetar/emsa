import { and, eq, inArray } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, projectSchema, updateProjectSchema } from "@/constants/schemas";
import { pillars, projectImages, projectRegistrations, projects, users } from "@/db/schema";
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

  const projectIds = rows.map((p) => p.id);
  const imagesByProject: Record<string, string[]> = {};

  if (projectIds.length > 0) {
    const allImages = await db
      .select({ projectId: projectImages.projectId, url: projectImages.url })
      .from(projectImages)
      .where(inArray(projectImages.projectId, projectIds))
      .orderBy(projectImages.order);

    for (const img of allImages) {
      (imagesByProject[img.projectId] ??= []).push(img.url);
    }
  }

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
      registrationOpensAt: projects.registrationOpensAt,
      registrationClosesAt: projects.registrationClosesAt,
      maxParticipants: projects.maxParticipants,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .orderBy(projects.startingAt);

  const adminProjectIds = rows.map((p) => p.id);
  const adminImagesByProject: Record<string, string[]> = {};

  if (adminProjectIds.length > 0) {
    const allImages = await db
      .select({ projectId: projectImages.projectId, url: projectImages.url })
      .from(projectImages)
      .where(inArray(projectImages.projectId, adminProjectIds))
      .orderBy(projectImages.order);

    for (const img of allImages) {
      (adminImagesByProject[img.projectId] ??= []).push(img.url);
    }
  }

  return Response.json(rows.map((p) => ({ ...p, images: adminImagesByProject[p.id] ?? [] })));
});

const createProject = withRole(Role.ADMIN, async (req) => {
  const { imageUrls, startingAt, registrationOpensAt, registrationClosesAt, ...rest } =
    await parseBody(req, projectSchema);

  const project = await db.transaction(async (tx) => {
    const [newProject] = await tx
      .insert(projects)
      .values({
        ...rest,
        startingAt: new Date(startingAt),
        registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt) : null,
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt) : null,
      })
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
  const { imageUrls, startingAt, registrationOpensAt, registrationClosesAt, ...rest } =
    await parseBody(req, updateProjectSchema);

  let imagesToDeleteFromS3: { url: string }[] = [];

  const updated = await db.transaction(async (tx) => {
    const [project] = await tx
      .update(projects)
      .set({
        ...rest,
        ...(startingAt !== undefined && { startingAt: new Date(startingAt) }),
        ...(registrationOpensAt !== undefined && {
          registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt) : null,
        }),
        ...(registrationClosesAt !== undefined && {
          registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt) : null,
        }),
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

const getProjectRegistrations = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;

  const rows = await db
    .select({
      id: projectRegistrations.id,
      userId: projectRegistrations.userId,
      userName: users.name,
      userEmail: users.email,
      userIndex: users.index,
      attended: projectRegistrations.attended,
      createdAt: projectRegistrations.createdAt,
    })
    .from(projectRegistrations)
    .innerJoin(users, eq(projectRegistrations.userId, users.id))
    .where(eq(projectRegistrations.projectId, id))
    .orderBy(projectRegistrations.createdAt);

  return Response.json(rows);
});

const updateRegistrationAttended = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;
  const body = (await req.json()) as { attended: boolean };

  const [updated] = await db
    .update(projectRegistrations)
    .set({ attended: body.attended })
    .where(eq(projectRegistrations.id, id))
    .returning();

  if (!updated) return Response.json({ error: "Registration not found" }, { status: 404 });

  return Response.json(updated);
});

const addProjectRegistration = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;
  const body = (await req.json()) as { userId: string };

  const [existing] = await db
    .select({ id: projectRegistrations.id })
    .from(projectRegistrations)
    .where(
      and(eq(projectRegistrations.projectId, id), eq(projectRegistrations.userId, body.userId))
    )
    .limit(1);

  if (existing) return Response.json({ error: "User already registered" }, { status: 409 });

  const [registration] = await db
    .insert(projectRegistrations)
    .values({ projectId: id, userId: body.userId })
    .returning();

  return Response.json(registration, { status: 201 });
});

const deleteProjectRegistration = withRole<{ id: string }>(Role.SUPER_ADMIN, async (req) => {
  const { id } = req.params;

  const [deleted] = await db
    .delete(projectRegistrations)
    .where(eq(projectRegistrations.id, id))
    .returning({ id: projectRegistrations.id });

  if (!deleted) return Response.json({ error: "Registration not found" }, { status: 404 });

  return Response.json({ success: true });
});

export const projectRoutes = {
  [ApiRoutes.PROJECTS]: { GET: getProjects },
  [ApiRoutes.PROJECT_BY_ID]: { GET: getProjectById },
  [ApiRoutes.ADMIN_PROJECTS_UPLOAD]: { GET: getProjectUploadUrl },
  [ApiRoutes.ADMIN_PROJECTS]: { GET: getProjectsAdmin, POST: createProject },
  [ApiRoutes.ADMIN_PROJECT_BY_ID]: { PATCH: updateProject, DELETE: deleteProject },
  [ApiRoutes.ADMIN_PROJECT_REGISTRATIONS]: {
    GET: getProjectRegistrations,
    POST: addProjectRegistration,
  },
  [ApiRoutes.ADMIN_PROJECT_REGISTRATION_BY_ID]: {
    PATCH: updateRegistrationAttended,
    DELETE: deleteProjectRegistration,
  },
};
