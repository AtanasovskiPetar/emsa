import { eq } from "drizzle-orm";

import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, updateOrganizationSchema } from "@/constants/schemas";
import { organization } from "@/db/schema";
import { db } from "@/lib/db";
import { parseBody, withRole } from "@/lib/middleware";
import { deleteS3Object, getPresignedUploadUrl } from "@/lib/s3";

const ORG_ID = 1;

// Public
const getOrganization = async () => {
  const [org] = await db
    .select({
      name: organization.name,
      logoUrl: organization.logoUrl,
      description: organization.description,
      aboutUs: organization.aboutUs,
    })
    .from(organization)
    .where(eq(organization.id, ORG_ID))
    .limit(1);

  return Response.json(org ?? null);
};

// Admin
const getOrganizationAdmin = withRole(Role.SUPER_ADMIN, async () => {
  const [org] = await db.select().from(organization).where(eq(organization.id, ORG_ID)).limit(1);
  return Response.json(org ?? null);
});

const updateOrganization = withRole(Role.SUPER_ADMIN, async (req) => {
  const data = await parseBody(req, updateOrganizationSchema);

  const [existing] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ORG_ID))
    .limit(1);

  const [updated] = await db
    .insert(organization)
    .values({ id: ORG_ID, ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: organization.id,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();

  if (existing?.logoUrl && data.logoUrl !== undefined && data.logoUrl !== existing.logoUrl) {
    deleteS3Object(existing.logoUrl).catch(console.error);
  }

  return Response.json(updated);
});

const getOrganizationUploadUrl = withRole(Role.SUPER_ADMIN, async (req) => {
  const contentType = new URL(req.url).searchParams.get("contentType") ?? "image/jpeg";

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const key = `organization/${crypto.randomUUID()}.${ext}`;
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);

  return Response.json({ uploadUrl, fileUrl, key });
});

export const organizationRoutes = {
  [ApiRoutes.ORGANIZATION]: { GET: getOrganization },
  [ApiRoutes.ADMIN_ORGANIZATION_UPLOAD]: { GET: getOrganizationUploadUrl },
  [ApiRoutes.ADMIN_ORGANIZATION]: { GET: getOrganizationAdmin, PATCH: updateOrganization },
};
