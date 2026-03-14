import { eq } from "drizzle-orm";

import { ApiRoutes } from "@/constants/routes";
import { organization } from "@/db/schema";
import { db } from "@/lib/db";

const ORG_ID = 1;

const getOrganization = async () => {
  const [org] = await db
    .select({ name: organization.name, logoUrl: organization.logoUrl })
    .from(organization)
    .where(eq(organization.id, ORG_ID))
    .limit(1);

  return Response.json(org ?? null);
};

export const organizationRoutes = {
  [ApiRoutes.ORGANIZATION]: { GET: getOrganization },
};
