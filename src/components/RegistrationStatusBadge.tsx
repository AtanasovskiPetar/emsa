import { Badge } from "@/components/ui/badge";
import { type RegistrationStatus } from "@/constants/types";
import { cn } from "@/lib/utils";

const REGISTRATION_BADGE: Record<
  Exclude<RegistrationStatus, "none">,
  { label: string; className: string; overlayClassName: string }
> = {
  not_open: {
    label: "Registration Soon",
    className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    overlayClassName: "border-0 bg-yellow-500/80 text-white backdrop-blur-sm",
  },
  open: {
    label: "Registration Open",
    className: "bg-green-500/15 text-green-600 border-green-500/30",
    overlayClassName: "border-0 bg-green-500/80 text-white backdrop-blur-sm",
  },
  full: {
    label: "Registration Full",
    className: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    overlayClassName: "border-0 bg-orange-500/80 text-white backdrop-blur-sm",
  },
  closed: {
    label: "Registration Closed",
    className: "bg-muted text-muted-foreground",
    overlayClassName: "border-0 bg-black/60 text-white backdrop-blur-sm",
  },
};

export function RegistrationStatusBadge({
  status,
  overlay = false,
  className,
}: {
  status: RegistrationStatus;
  overlay?: boolean;
  className?: string;
}) {
  if (status === "none") return null;
  const badge = REGISTRATION_BADGE[status];
  return (
    <Badge className={cn(overlay ? badge.overlayClassName : badge.className, className)}>
      {badge.label}
    </Badge>
  );
}
