import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavBody,
} from "@/components/ui/resizable-navbar";
import { Separator } from "@/components/ui/separator";
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

function OrgLogo({ org }: { org?: OrganizationPublic }) {
  return (
    <Link to={PageRoutes.HOME} className="relative z-20 flex items-center px-2 py-1">
      {org?.logoUrl ? (
        <img src={org.logoUrl} alt="Logo" className="size-8 rounded object-cover" />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {org?.name?.charAt(0) ?? "E"}
        </div>
      )}
    </Link>
  );
}

function DesktopNavLinks() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className="pointer-events-none absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium lg:flex"
    >
      {navLinks.map((link, idx) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === PageRoutes.HOME}
          onMouseEnter={() => setHovered(idx)}
          className="pointer-events-auto relative px-4 py-2"
        >
          {({ isActive }) => (
            <>
              {hovered === idx && (
                <motion.div
                  layoutId="hovered"
                  className="absolute inset-0 h-full w-full rounded-full bg-accent dark:bg-neutral-800"
                />
              )}
              <span
                className={cn(
                  "relative z-20 text-neutral-600 dark:text-neutral-300",
                  isActive && "font-semibold text-primary"
                )}
              >
                {link.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute bottom-1 left-1/2 block h-0.5 w-3 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </motion.div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

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
        <DropdownMenuItem asChild>
          <Link to={PageRoutes.LOGIN} onClick={logout}>
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileUserSection({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={PageRoutes.LOGIN} onClick={onClose}>
            Log in
          </Link>
        </Button>
        <Button className="w-full" asChild>
          <Link to={PageRoutes.REGISTER} onClick={onClose}>
            Register
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} imageUrl={user.imageUrl ?? null} className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Separator />
      <Link
        to={PageRoutes.PROFILE}
        onClick={onClose}
        className="text-sm font-medium text-neutral-600 dark:text-neutral-300"
      >
        Profile
      </Link>
      {hasAccess(user.role, Role.ADMIN) && (
        <Link
          to={PageRoutes.ADMIN}
          onClick={onClose}
          className="text-sm font-medium text-neutral-600 dark:text-neutral-300"
        >
          Admin Panel
        </Link>
      )}
      <Link
        to={PageRoutes.LOGIN}
        onClick={() => {
          logout();
          onClose();
        }}
        className="text-sm font-medium text-destructive"
      >
        Sign out
      </Link>
    </div>
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
      <Navbar>
        {/* Desktop */}
        <NavBody>
          <OrgLogo org={org} />
          <DesktopNavLinks />
          <UserMenu />
        </NavBody>

        {/* Mobile */}
        <MobileNav>
          <MobileNavHeader>
            <OrgLogo org={org} />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
          </MobileNavHeader>

          <MobileNavMenu isOpen={mobileOpen}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === PageRoutes.HOME}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-neutral-600 dark:text-neutral-300",
                    isActive && "font-semibold text-primary"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="w-full border-t pt-4">
              <MobileUserSection onClose={() => setMobileOpen(false)} />
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="flex-1 pt-14">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {org?.name ?? "EMSA"}. All rights reserved.
          </p>
          {(org?.instagramUrl || org?.facebookUrl) && (
            <div className="flex items-center gap-3">
              {org.instagramUrl && (
                <a
                  href={org.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Instagram"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {org.facebookUrl && (
                <a
                  href={org.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Facebook"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
