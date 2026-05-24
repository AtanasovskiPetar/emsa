import { eq, isNotNull } from "drizzle-orm";

import { ApiRoutes } from "@/constants/routes";
import { pillars, projectImages, projects } from "@/db/schema";
import { db } from "@/lib/db";

const getGallery = async () => {
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

  const images = [
    ...projectImgs.map((img) => ({ url: img.url, label: img.label })),
    ...pillarRows.map((p) => ({ url: p.imageUrl!, label: p.name })),
  ];

  return Response.json(images);
};

export const galleryRoutes = {
  [ApiRoutes.GALLERY]: { GET: getGallery },
};
