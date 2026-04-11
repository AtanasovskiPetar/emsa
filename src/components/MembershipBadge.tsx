import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MembershipBadgeProps {
  isActive: boolean;
  isAlumni: boolean;
  className?: string;
}

export function MembershipBadge({ isActive, isAlumni, className }: MembershipBadgeProps) {
  if (isAlumni) {
    return (
      <Badge variant="secondary" className={cn(className)}>
        Alumni
      </Badge>
    );
  }
  if (isActive) {
    return (
      <Badge className={cn("bg-green-500 text-white hover:bg-green-500", className)}>Active</Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("text-muted-foreground", className)}>
      Inactive
    </Badge>
  );
}
