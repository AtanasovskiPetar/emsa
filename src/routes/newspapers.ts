import { desc, eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { newspaperSchema, updateNewspaperSchema } from "@/constants/schemas";
import { newspapers } from "@/db/schema";
import { db } from "@/lib/db";
import { HttpError, parseBody, withRole } from "@/lib/middleware";
import { deleteS3Object, getPresignedUploadUrl, validatePdfContentType } from "@/lib/s3";

const getNewspapers = async () => {
  const rows = await db.select().from(newspapers).orderBy(desc(newspapers.releaseDate));
  return Response.json(rows);
};

const createNewspaper = withRole(Role.ADMIN, async (req) => {
  const data = await parseBody(req, newspaperSchema);
  const [row] = await db
    .insert(newspapers)
    .values({ ...data, releaseDate: new Date(data.releaseDate) })
    .returning();
  return Response.json(row, { status: 201 });
});

const updateNewspaper = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;
  const { releaseDate, ...rest } = await parseBody(req, updateNewspaperSchema);

  const [existing] = await db.select().from(newspapers).where(eq(newspapers.id, id)).limit(1);
  if (!existing) throw new HttpError(404, "Newspaper not found");

  const [updated] = await db
    .update(newspapers)
    .set({
      ...rest,
      ...(releaseDate !== undefined && { releaseDate: new Date(releaseDate) }),
      updatedAt: new Date(),
    })
    .where(eq(newspapers.id, id))
    .returning();

  if (rest.pdfUrl !== undefined && rest.pdfUrl !== existing.pdfUrl) {
    deleteS3Object(existing.pdfUrl).catch(console.error);
  }

  return Response.json(updated);
});

const deleteNewspaper = withRole<{ id: string }>(Role.ADMIN, async (req) => {
  const { id } = req.params;
  const [deleted] = await db.delete(newspapers).where(eq(newspapers.id, id)).returning();
  if (!deleted) throw new HttpError(404, "Newspaper not found");
  deleteS3Object(deleted.pdfUrl).catch(console.error);
  return Response.json(deleted);
});

const getNewspaperUploadUrl = withRole(Role.ADMIN, async (req) => {
  const contentType = new URL(req.url).searchParams.get("contentType") ?? "application/pdf";
  validatePdfContentType(contentType);
  const key = `newspapers/${crypto.randomUUID()}.pdf`;
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);
  return Response.json({ uploadUrl, fileUrl, key });
});

export const newspaperRoutes = {
  [ApiRoutes.NEWSPAPERS]: { GET: getNewspapers },
  [ApiRoutes.ADMIN_NEWSPAPERS]: { POST: createNewspaper },
  [ApiRoutes.ADMIN_NEWSPAPER_BY_ID]: { PATCH: updateNewspaper, DELETE: deleteNewspaper },
  [ApiRoutes.ADMIN_NEWSPAPERS_UPLOAD]: { GET: getNewspaperUploadUrl },
};
