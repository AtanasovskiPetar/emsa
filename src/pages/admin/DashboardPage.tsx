import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, FolderOpen, Mountain, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type DashboardStats } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const TODAY = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface StatRowProps {
  label: string;
  value: number;
  accent?: boolean;
}

function StatRow({ label, value, accent }: StatRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent && "text-emerald-600")}>{value}</span>
    </div>
  );
}

interface StatCardProps {
  title: string;
  total: number;
  totalLabel: string;
  icon: React.ReactNode;
  iconBg: string;
  rows: { label: string; value: number; accent?: boolean }[];
  footer?: React.ReactNode;
  to: string;
}

function StatCard({ title, total, totalLabel, icon, iconBg, rows, footer, to }: StatCardProps) {
  return (
    <Link to={to} className="block">
      <Card className="cursor-pointer transition-all duration-200 ease-fluid hover:-translate-y-1 hover:shadow-[var(--shadow-material)]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("flex size-10 items-center justify-center rounded-lg", iconBg)}>
                {icon}
              </div>
              <span className="text-sm font-medium">{title}</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50" />
          </div>

          <div className="mt-4">
            <div className="text-4xl font-bold tracking-tight">{total}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{totalLabel}</div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t pt-4">
            {rows.map((row) => (
              <StatRow key={row.label} label={row.label} value={row.value} accent={row.accent} />
            ))}
          </div>

          {footer && <div className="mt-4 border-t pt-4">{footer}</div>}
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => apiClient.get<DashboardStats>(ApiRoutes.ADMIN_DASHBOARD),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!stats) return null;

  const nextProject = stats.projects.next;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Dashboard"
        title={`${getGreeting()}${user ? `, ${user.name.split(" ")[0]}` : ""}!`}
        description={TODAY}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Users"
          total={stats.users.total}
          totalLabel="Total members"
          icon={<Users className="size-5 text-sky-600" />}
          iconBg="bg-sky-100"
          rows={[
            { label: "Active", value: stats.users.active, accent: true },
            { label: "Inactive", value: stats.users.inactive },
          ]}
          to={PageRoutes.ADMIN_USERS}
        />

        <StatCard
          title="Projects"
          total={stats.projects.total}
          totalLabel="Total projects"
          icon={<FolderOpen className="size-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          rows={[
            { label: "Upcoming", value: stats.projects.upcoming, accent: true },
            { label: "This month", value: stats.projects.thisMonth },
          ]}
          footer={
            nextProject ? (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Next: <span className="font-medium text-foreground">{nextProject.title}</span>
                  {" · "}
                  {new Date(nextProject.startingAt).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ) : null
          }
          to={PageRoutes.ADMIN_PROJECTS}
        />

        <StatCard
          title="Pillars"
          total={stats.pillars.total}
          totalLabel="Total pillars"
          icon={<Mountain className="size-5 text-violet-600" />}
          iconBg="bg-violet-100"
          rows={[]}
          to={PageRoutes.ADMIN_PILLARS}
        />
      </div>
    </div>
  );
}
