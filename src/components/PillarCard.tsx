import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageRoutes } from "@/constants/routes";
import { type PublicPillar } from "@/constants/types";
import { cn } from "@/lib/utils";

interface PillarCardProps {
  pillar: PublicPillar;
  className?: string;
}

export function PillarCard({ pillar, className }: PillarCardProps) {
  return (
    <Link
      to={PageRoutes.PILLAR_DETAIL.replace(":id", pillar.id)}
      className={cn("group block", className)}
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">{pillar.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">{pillar.description}</p>
          {pillar.directorName && (
            <p className="text-xs text-muted-foreground">
              Director: <span className="font-medium text-foreground">{pillar.directorName}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
