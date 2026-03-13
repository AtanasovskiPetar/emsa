import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Mountain, Users } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { NavUser } from "@/components/admin/NavUser";
import { hasAccess } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Role } from "@/constants/enums";
import { PageRoutes, ApiRoutes } from "@/constants/routes";
import { type UserProfile } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";

const navItems = [
  {
    title: "Dashboard",
    url: PageRoutes.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
    requiredRole: Role.ADMIN,
  },
  {
    title: "Users",
    url: PageRoutes.ADMIN_USERS,
    icon: Users,
    requiredRole: Role.SUPER_ADMIN,
  },
  {
    title: "Pillars",
    url: PageRoutes.ADMIN_PILLARS,
    icon: Mountain,
    requiredRole: Role.SUPER_ADMIN,
  },
];

export function AdminLayout() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<UserProfile>(ApiRoutes.USERS_ME),
  });

  useEffect(() => {
    if (profile?.imageUrl !== undefined) {
      updateUser({ imageUrl: profile.imageUrl });
    }
  }, [profile?.imageUrl]);

  const pageTitle = navItems.find((item) => item.url === pathname)?.title ?? "Admin";

  function handleLogout() {
    logout();
    navigate(PageRoutes.LOGIN);
  }

  return (
    <SidebarProvider className="min-h-screen w-full">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <NavLink to={PageRoutes.ADMIN_DASHBOARD}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <LayoutDashboard className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Admin Panel</span>
                    <span className="text-xs text-muted-foreground">Management</span>
                  </div>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems
                  .filter((item) => user && hasAccess(user.role, item.requiredRole))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) => (isActive ? "font-medium" : "")}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>{user && <NavUser user={user} onLogout={handleLogout} />}</SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">{pageTitle}</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
