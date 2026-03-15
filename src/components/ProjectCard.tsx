import { CalendarDays, Layers } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageRoutes } from "@/constants/routes";
import { type PublicProject } from "@/constants/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: PublicProject;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const cover = project.images[0];
  const isUpcoming = new Date(project.startingAt) >= new Date();
  const date = new Date(project.startingAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      to={PageRoutes.PROJECT_DETAIL.replace(":id", project.id)}
      className={cn("group block", className)}
    >
      <Card className="h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={project.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Layers className="size-10 opacity-30" />
            </div>
          )}
          {isUpcoming && (
            <Badge className="absolute left-2 top-2 bg-emerald-500 text-white hover:bg-emerald-500">
              Upcoming
            </Badge>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-base">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2 pt-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {date}
          </div>
          {project.pillarName && (
            <Badge variant="secondary" className="text-xs">
              {project.pillarName}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
