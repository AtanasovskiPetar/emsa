import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, projectSchema, updateProjectSchema } from "@/constants/schemas";
import { pillars, projectImages, projects } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";
import { getPresignedUploadUrl } from "@/lib/s3";

const getProjects = withRole(Role.ADMIN, async () => {
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

  const [project] = await db
    .insert(projects)
    .values({ ...rest, startingAt: new Date(startingAt) })
    .returning();

  if (!project) {
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }

  if (imageUrls.length > 0) {
    await db
      .insert(projectImages)
      .values(imageUrls.map((url, i) => ({ projectId: project.id, url, order: i })));
  }

  return Response.json(project, { status: 201 });
});

const updateProject = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;
  const { imageUrls, startingAt, ...rest } = await parseBody(req, updateProjectSchema);

  const [updated] = await db
    .update(projects)
    .set({
      ...rest,
      ...(startingAt !== undefined && { startingAt: new Date(startingAt) }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (imageUrls !== undefined) {
    await db.delete(projectImages).where(eq(projectImages.projectId, id));
    if (imageUrls.length > 0) {
      await db
        .insert(projectImages)
        .values(imageUrls.map((url, i) => ({ projectId: id, url, order: i })));
    }
  }

  return Response.json(updated);
});

const deleteProject = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });

  if (!deleted) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({ success: true });
});

const getProjectUploadUrl = withRole(Role.ADMIN, async (req) => {
  const contentType = new URL(req.url).searchParams.get("contentType") ?? "image/jpeg";

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const result = await getPresignedUploadUrl(
    `project-images/${crypto.randomUUID()}.${ext}`,
    contentType
  );

  return Response.json(result);
});

export const projectRoutes = {
  [ApiRoutes.ADMIN_PROJECTS_UPLOAD]: { GET: getProjectUploadUrl },
  [ApiRoutes.ADMIN_PROJECTS]: { GET: getProjects, POST: createProject },
  [ApiRoutes.ADMIN_PROJECT_BY_ID]: { PATCH: updateProject, DELETE: deleteProject },
};
