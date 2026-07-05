import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Images,
  Layers,
  List,
  Package,
  Users,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Lightbox } from "@/components/Lightbox";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import {
  type MyRegistration,
  type PublicProject,
  type PublicProjectPackage,
  type Workshop,
} from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { cn, formatDate, formatDateTime, getRegistrationStatus } from "@/lib/utils";

interface RegistrationSectionProps {
  project: PublicProject;
  status: ReturnType<typeof getRegistrationStatus>;
  user: { id: string; isActive: boolean } | null;
  myRegistration: MyRegistration | undefined;
  isRegistering: boolean;
  isUnregistering: boolean;
  registerError: Error | null;
  selectedPackageId: string | null;
  onSelectPackage: (id: string | null) => void;
  onRegister: () => void;
  onUnregister: () => void;
}

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PublicProjectPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  const isFull = !pkg.canRegister;
  return (
    <button
      type="button"
      disabled={isFull}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : isFull
            ? "cursor-not-allowed border-muted bg-muted/30 opacity-60"
            : "hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{pkg.name}</span>
        {isFull && <span className="shrink-0 text-xs text-muted-foreground">Full</span>}
      </div>
      {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
    </button>
  );
}

function RegistrationSection({
  project,
  status,
  user,
  myRegistration,
  isRegistering,
  isUnregistering,
  registerError,
  selectedPackageId,
  onSelectPackage,
  onRegister,
  onUnregister,
}: RegistrationSectionProps) {
  const canUnregister =
    !project.registrationClosesAt || new Date(project.registrationClosesAt) > new Date();
  const hasPackages = project.packages.length > 0;

  if (myRegistration?.registered) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            <span>You&apos;re registered</span>
          </div>
          {myRegistration.packageName && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="size-3.5" />
              {myRegistration.packageName}
            </div>
          )}
          {canUnregister && (
            <Button variant="outline" size="sm" onClick={onUnregister} disabled={isUnregistering}>
              {isUnregistering ? "Cancelling..." : "Cancel registration"}
            </Button>
          )}
        </div>
        {myRegistration.certificateUrl && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={myRegistration.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={myRegistration.certificateFilename ?? undefined}
            >
              <Award className="size-4" />
              <Download className="size-3.5" />
              Certificate
            </a>
          </Button>
        )}
      </div>
    );
  }

  if (status === "not_open" || status === "closed" || status === "full") {
    const label =
      status === "not_open"
        ? `Registration opens ${new Date(project.registrationOpensAt!).toLocaleString("en-GB", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
        : status === "full"
          ? "No spots remaining"
          : "Registration closed";
    return <p className="text-sm text-muted-foreground">{label}</p>;
  }

  // open — check active-only restriction before showing register button
  if (status === "open" && project.activeMembersOnly && user && !user.isActive) {
    return (
      <p className="text-sm text-muted-foreground">
        Registration is open for active members only. Become an active member to join this project.
      </p>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link to={PageRoutes.LOGIN}>Log in to register</Link>
        </Button>
        {project.activeMembersOnly && (
          <p className="text-xs text-muted-foreground">
            Active membership is required to register for this project.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasPackages && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Select a package</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {project.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackageId === pkg.id}
                onSelect={() => onSelectPackage(pkg.id === selectedPackageId ? null : pkg.id)}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Button
          size="sm"
          className="w-fit"
          onClick={onRegister}
          disabled={isRegistering || (hasPackages && !selectedPackageId)}
        >
          {isRegistering ? "Registering..." : "Register"}
        </Button>
        {hasPackages && !selectedPackageId && (
          <p className="text-xs text-muted-foreground">Please select a package to continue.</p>
        )}
        {registerError && (
          <p className="text-xs text-destructive">
            {registerError instanceof Error ? registerError.message : "Failed to register."}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Workshops Section ──────────────────────────────────────────────────────

type CalendarView = "dayGridMonth" | "listMonth";

function WorkshopsSection({
  projectId,
  userId,
  isProjectRegistered,
}: {
  projectId: string;
  userId: string | null;
  isProjectRegistered: boolean;
}) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("listMonth");

  const { data: workshops = [], isLoading } = useQuery({
    queryKey: queryKeys.publicWorkshops(projectId),
    queryFn: () => apiClient.get<Workshop[]>(ApiRoutes.PROJECT_WORKSHOPS.replace(":id", projectId)),
    staleTime: 60_000,
  });

  const { mutate: registerWorkshop, isPending: isRegistering } = useMutation({
    mutationFn: (workshopId: string) =>
      apiClient.post(ApiRoutes.WORKSHOP_REGISTER.replace(":workshopId", workshopId), {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.publicWorkshops(projectId) }),
  });

  const { mutate: unregisterWorkshop, isPending: isUnregistering } = useMutation({
    mutationFn: (workshopId: string) =>
      apiClient.delete(ApiRoutes.WORKSHOP_REGISTER.replace(":workshopId", workshopId)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.publicWorkshops(projectId) }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (workshops.length === 0) return null;

  const calendarEvents = workshops.map((w) => ({
    id: w.id,
    title: w.title,
    start: w.startingAt,
    end: w.endingAt ?? undefined,
    backgroundColor: w.myRegistration ? "hsl(var(--primary))" : "hsl(var(--muted))",
    borderColor: w.myRegistration ? "hsl(var(--primary))" : "hsl(var(--border))",
    textColor: w.myRegistration ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
  }));

  function getWorkshopAction(w: Workshop) {
    if (!userId) return { label: "Sign in to register", disabled: true };
    if (!isProjectRegistered) return { label: "Register for project first", disabled: true };
    const now = new Date();
    if (w.myRegistration) {
      const closed = w.registrationClosesAt && new Date(w.registrationClosesAt) < now;
      if (closed) return { label: "Registration closed", disabled: true };
      return { label: "Cancel", disabled: isUnregistering, action: () => unregisterWorkshop(w.id) };
    }
    if (w.registrationOpensAt && new Date(w.registrationOpensAt) > now)
      return { label: `Opens ${formatDate(w.registrationOpensAt)}`, disabled: true };
    if (w.registrationClosesAt && new Date(w.registrationClosesAt) < now)
      return { label: "Registration closed", disabled: true };
    if (w.availableSpots === 0) return { label: "Full", disabled: true };
    return { label: "Register", disabled: isRegistering, action: () => registerWorkshop(w.id) };
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-2xl font-bold text-transparent">
          Workshops
        </h2>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <button
            onClick={() => setView("listMonth")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "listMonth"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5" />
            Agenda
          </button>
          <button
            onClick={() => setView("dayGridMonth")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "dayGridMonth"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarRange className="size-3.5" />
            Calendar
          </button>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView={view}
          key={view}
          events={calendarEvents}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          height="auto"
          eventDisplay="block"
        />
      </div>

      <div className="space-y-4">
        {workshops.map((w) => {
          const action = getWorkshopAction(w);
          return (
            <div
              key={w.id}
              className={cn(
                "rounded-xl border p-5 transition-colors",
                w.myRegistration && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{w.title}</h3>
                    {w.myRegistration && (
                      <Badge variant="default" className="text-xs">
                        Registered
                      </Badge>
                    )}
                    {w.availableSpots === 0 && !w.myRegistration && (
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {w.endingAt
                        ? `${formatDateTime(w.startingAt)} – ${formatDateTime(w.endingAt)}`
                        : formatDateTime(w.startingAt)}
                    </span>
                    {w.maxParticipants !== null && (
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {w.registeredCount} / {w.maxParticipants} spots
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <div
                      className="prose prose-sm prose-neutral mt-2 line-clamp-2 max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description) }}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  variant={w.myRegistration ? "outline" : "default"}
                  disabled={action.disabled}
                  onClick={action.action}
                  className="shrink-0"
                >
                  {action.label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [showUnregisterWarning, setShowUnregisterWarning] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: queryKeys.publicProject(id!),
    queryFn: () => apiClient.get<PublicProject>(ApiRoutes.PROJECT_BY_ID.replace(":id", id!)),
    enabled: !!id,
  });

  const { data: myRegistration } = useQuery({
    queryKey: queryKeys.myRegistration(id!),
    queryFn: () =>
      apiClient.get<MyRegistration>(ApiRoutes.PROJECT_MY_REGISTRATION.replace(":id", id!)),
    enabled: !!id && !!user,
  });

  const invalidateRegistration = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.myRegistration(id!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.publicProject(id!) });
  };

  const {
    mutate: register,
    isPending: isRegistering,
    error: registerError,
  } = useMutation({
    mutationFn: () =>
      apiClient.post(ApiRoutes.PROJECT_REGISTER.replace(":id", id!), {
        packageId: selectedPackageId,
      }),
    onSuccess: () => {
      setSelectedPackageId(null);
      invalidateRegistration();
    },
  });

  const { mutate: unregister, isPending: isUnregistering } = useMutation({
    mutationFn: () => apiClient.delete(ApiRoutes.PROJECT_REGISTER.replace(":id", id!)),
    onSuccess: () => {
      setShowUnregisterWarning(false);
      invalidateRegistration();
      queryClient.invalidateQueries({ queryKey: queryKeys.publicWorkshops(id!) });
    },
  });

  const { data: workshops = [] } = useQuery({
    queryKey: queryKeys.publicWorkshops(id!),
    queryFn: () => apiClient.get<Workshop[]>(ApiRoutes.PROJECT_WORKSHOPS.replace(":id", id!)),
    enabled: !!id,
    staleTime: 60_000,
  });

  const workshopRegistrationCount = workshops.filter((w) => w.myRegistration).length;

  function handleUnregisterClick() {
    if (workshopRegistrationCount > 0) {
      setShowUnregisterWarning(true);
    } else {
      unregister();
    }
  }

  const regStatus = project ? getRegistrationStatus(project) : "none";
  const isUpcoming = project ? new Date(project.startingAt) >= new Date() : false;

  const formatProjectDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-GB", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const date = project
    ? project.endingAt
      ? `${formatProjectDate(project.startingAt)} – ${formatProjectDate(project.endingAt)}`
      : formatProjectDate(project.startingAt)
    : null;

  const cover = project?.images[0];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-72 overflow-hidden bg-muted">
        {isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : cover ? (
          <img
            src={cover}
            alt={project!.title}
            className="size-full cursor-pointer object-cover transition-transform duration-500 hover:scale-105"
            onClick={() => setLightboxIndex(0)}
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 via-background to-chart-2/20">
            <div className="flex size-full items-center justify-center">
              <Layers className="size-20 text-muted-foreground/20" />
            </div>
          </div>
        )}

        {/* Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* Back button */}
        <div className="absolute left-4 top-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <Link to={PageRoutes.PROJECTS}>
              <ArrowLeft className="mr-1 size-4" />
              All Projects
            </Link>
          </Button>
        </div>

        {/* Overlay metadata */}
        {!isLoading && project && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                {isUpcoming && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    Upcoming
                  </Badge>
                )}
                {project.pillarName && (
                  <Badge className="border-0 bg-white/20 text-white hover:bg-white/30">
                    {project.pillarName}
                  </Badge>
                )}
                <RegistrationStatusBadge status={regStatus} overlay />
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white drop-shadow md:text-4xl">
                {project.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                <CalendarDays className="size-4" />
                {date}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className={cn("h-4", i === 0 ? "w-3/4" : "w-full")} />
            ))}
          </div>
        ) : !project ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Project not found.</p>
            <Button asChild className="mt-4">
              <Link to={PageRoutes.PROJECTS}>Back to Projects</Link>
            </Button>
          </div>
        ) : (
          <>
            {regStatus !== "none" && (
              <div className="mb-8">
                <RegistrationSection
                  project={project}
                  status={regStatus}
                  user={user ? { id: user.id, isActive: user.isActive } : null}
                  myRegistration={myRegistration}
                  isRegistering={isRegistering}
                  isUnregistering={isUnregistering}
                  registerError={registerError}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={setSelectedPackageId}
                  onRegister={() => register()}
                  onUnregister={handleUnregisterClick}
                />
              </div>
            )}
            {project.description && (
              <div
                className="prose prose-neutral max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(project.description) }}
              />
            )}
            {workshops.length > 0 && (
              <div className="mt-12">
                <WorkshopsSection
                  projectId={id!}
                  userId={user?.id ?? null}
                  isProjectRegistered={myRegistration?.registered === true}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Workshops unregister warning */}
      <AlertDialog open={showUnregisterWarning} onOpenChange={setShowUnregisterWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Project Registration</AlertDialogTitle>
            <AlertDialogDescription>
              You are also registered for{" "}
              <strong>
                {workshopRegistrationCount} workshop{workshopRegistrationCount !== 1 ? "s" : ""}
              </strong>{" "}
              in this project. Canceling your project registration will also remove those workshop
              registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => unregister()}>
              Cancel Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Parallax gallery */}
      {project && project.images.length > 1 && (
        <div className="border-t px-4 pb-16 pt-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-2xl font-bold text-transparent">
                  Photos
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Images className="size-4" />
                  {project.images.length} images
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.images.map((img, i) => (
                <img
                  key={img}
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="aspect-video w-full cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && project && (
          <Lightbox
            images={project.images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
