import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { Role } from "@/constants/enums";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import { type OrganizationPublic } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { cn, hasAccess } from "@/lib/utils";

const navLinks = [
  { label: "Home", to: PageRoutes.HOME },
  { label: "Projects", to: PageRoutes.PROJECTS },
];

function MobileNavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === PageRoutes.HOME}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              isActive ? "bg-accent text-foreground" : "text-muted-foreground"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(PageRoutes.LOGIN);
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={PageRoutes.LOGIN}>Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to={PageRoutes.REGISTER}>Register</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <UserAvatar name={user.name} imageUrl={user.imageUrl ?? null} className="size-8" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={PageRoutes.PROFILE}>Profile</Link>
        </DropdownMenuItem>
        {hasAccess(user.role, Role.ADMIN) && (
          <DropdownMenuItem asChild>
            <Link to={PageRoutes.ADMIN}>Admin Panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: () => apiClient.get<OrganizationPublic>(ApiRoutes.ORGANIZATION),
    staleTime: Infinity,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Left: logo + name */}
          <Link to={PageRoutes.HOME} className="flex items-center gap-2.5">
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="size-8 rounded object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                {org?.name?.charAt(0) ?? "E"}
              </div>
            )}
            <span className="font-semibold">{org?.name ?? "EMSA"}</span>
          </Link>

          {/* Center: desktop nav — absolutely centered relative to the full header */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.to}>
                    <NavigationMenuLink asChild>
                      <NavLink
                        to={link.to}
                        end={link.to === PageRoutes.HOME}
                        className={({ isActive }) =>
                          cn(
                            navigationMenuTriggerStyle,
                            isActive && "bg-accent/50 text-accent-foreground"
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right: user menu (desktop) or hamburger (mobile) */}
          <div className="flex items-center justify-end">
            <div className="hidden md:block">
              <UserMenu />
            </div>
            <button
              className="rounded-md p-2 hover:bg-accent md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3">
              <MobileNavLinks onClick={() => setMobileOpen(false)} />
            </nav>
            <div className="border-t px-4 py-3">
              <UserMenu />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {org?.name ?? "EMSA"}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
