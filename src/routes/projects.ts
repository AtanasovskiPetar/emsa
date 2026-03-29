import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";

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
      registrationOpensAt: projects.registrationOpensAt,
      registrationClosesAt: projects.registrationClosesAt,
      maxParticipants: projects.maxParticipants,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .orderBy(projects.startingAt);

  const projectIds = rows.map((p) => p.id);
  const imagesByProject: Record<string, string[]> = {};
  const countByProject: Record<string, number> = {};

  if (projectIds.length > 0) {
    const allImages = await db
      .select({ projectId: projectImages.projectId, url: projectImages.url })
      .from(projectImages)
      .where(inArray(projectImages.projectId, projectIds))
      .orderBy(projectImages.order);

    for (const img of allImages) {
      (imagesByProject[img.projectId] ??= []).push(img.url);
    }

    const counts = await db
      .select({ projectId: projectRegistrations.projectId, count: count() })
      .from(projectRegistrations)
      .where(inArray(projectRegistrations.projectId, projectIds))
      .groupBy(projectRegistrations.projectId);

    for (const row of counts) {
      countByProject[row.projectId] = row.count;
    }
  }

  return Response.json(
    rows.map((p) => ({
      ...p,
      images: imagesByProject[p.id] ?? [],
      participantCount: countByProject[p.id] ?? 0,
    }))
  );
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
      registrationOpensAt: projects.registrationOpensAt,
      registrationClosesAt: projects.registrationClosesAt,
      maxParticipants: projects.maxParticipants,
    })
    .from(projects)
    .leftJoin(pillars, eq(projects.pillarId, pillars.id))
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const [images, [participantRow]] = await Promise.all([
    db
      .select({ url: projectImages.url })
      .from(projectImages)
      .where(eq(projectImages.projectId, id))
      .orderBy(projectImages.order),
    db
      .select({ count: count() })
      .from(projectRegistrations)
      .where(eq(projectRegistrations.projectId, id)),
  ]);

  return Response.json({
    ...row,
    images: images.map((i) => i.url),
    participantCount: participantRow?.count ?? 0,
  });
};

const getMyRegistration = withRole<{ id: string }>(Role.USER, async (req, user) => {
  const { id } = req.params;

  const [reg] = await db
    .select({ id: projectRegistrations.id, createdAt: projectRegistrations.createdAt })
    .from(projectRegistrations)
    .where(and(eq(projectRegistrations.projectId, id), eq(projectRegistrations.userId, user.sub)))
    .limit(1);

  return Response.json(
    reg ? { registered: true, id: reg.id, createdAt: reg.createdAt } : { registered: false }
  );
});

const unregisterFromProject = withRole<{ id: string }>(Role.USER, async (req, user) => {
  const { id } = req.params;

  const [project] = await db
    .select({ registrationClosesAt: projects.registrationClosesAt })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const now = new Date();
  if (project.registrationClosesAt && project.registrationClosesAt < now) {
    return Response.json({ error: "Registration has already closed" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(projectRegistrations)
    .where(and(eq(projectRegistrations.projectId, id), eq(projectRegistrations.userId, user.sub)))
    .returning({ id: projectRegistrations.id });

  if (!deleted) return Response.json({ error: "Registration not found" }, { status: 404 });

  return Response.json({ success: true });
});

const registerForProject = withRole<{ id: string }>(Role.USER, async (req, user) => {
  const { id } = req.params;

  const [project] = await db
    .select({
      registrationOpensAt: projects.registrationOpensAt,
      registrationClosesAt: projects.registrationClosesAt,
      maxParticipants: projects.maxParticipants,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const now = new Date();

  if (!project.registrationOpensAt || project.registrationOpensAt > now) {
    return Response.json({ error: "Registration is not open yet" }, { status: 422 });
  }

  if (project.registrationClosesAt && project.registrationClosesAt < now) {
    return Response.json({ error: "Registration has closed" }, { status: 422 });
  }

  try {
    const [registration] = await db.transaction(async (tx) => {
      if (project.maxParticipants !== null) {
        // Lock the project row to serialize concurrent capacity checks
        await tx
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.id, id))
          .for("update")
          .limit(1);

        const [countRow] = await tx
          .select({ count: count() })
          .from(projectRegistrations)
          .where(eq(projectRegistrations.projectId, id));

        if ((countRow?.count ?? 0) >= project.maxParticipants) {
          throw new HttpError(422, "No spots remaining");
        }
      }

      return tx
        .insert(projectRegistrations)
        .values({ projectId: id, userId: user.sub })
        .returning();
    });

    return Response.json(registration, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // Unique constraint violation — user already registered
    if ((err as { code?: string }).code === "23505") {
      return Response.json({ error: "Already registered" }, { status: 409 });
    }
    throw err;
  }
});

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
  const body = await parseBody(req, z.object({ attended: z.boolean() }));

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
  const body = await parseBody(req, z.object({ userId: z.uuid() }));

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
  [ApiRoutes.PROJECT_REGISTER]: { POST: registerForProject, DELETE: unregisterFromProject },
  [ApiRoutes.PROJECT_MY_REGISTRATION]: { GET: getMyRegistration },
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
