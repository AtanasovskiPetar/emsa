import { eq, isNotNull } from "drizzle-orm";

import { ApiRoutes } from "@/constants/routes";
import { pillars, projectImages, projects } from "@/db/schema";
import { db } from "@/lib/db";

const GALLERY_LIMIT = 30;

const getGallery = async (req: Request) => {
  const url = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "0", 10) || GALLERY_LIMIT)
  );

  const [projectImgs, pillarRows] = await Promise.all([
    db
      .select({ url: projectImages.url, label: projects.title })
      .from(projectImages)
      .innerJoin(projects, eq(projectImages.projectId, projects.id)),
    db
      .select({ imageUrl: pillars.imageUrl, name: pillars.name })
      .from(pillars)
      .where(isNotNull(pillars.imageUrl)),
  ]);

  const all = [
    ...projectImgs.map((img) => ({ url: img.url, label: img.label })),
    ...pillarRows.map((p) => ({ url: p.imageUrl!, label: p.name })),
  ];

  const total = all.length;
  const images = all.slice(offset, offset + limit);

  return Response.json({ images, total, hasMore: offset + images.length < total });
};

export const galleryRoutes = {
  [ApiRoutes.GALLERY]: { GET: getGallery },
};
