import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Award, Pin, Plus, Search, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { DataTableEmptyRow } from "@/components/admin/DataTableEmptyRow";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import {
  type DraftCapacityPool,
  type DraftPackage,
  ProjectDialog,
} from "@/components/admin/ProjectDialog";
import { RowActions } from "@/components/admin/RowActions";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Role } from "@/constants/enums";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type ProjectFormValues } from "@/constants/schemas";
import {
  type ActiveImageEntry,
  type AdminUser,
  type Project,
  type ProjectPackage,
  type ProjectRegistration,
} from "@/constants/types";
import { useAuth } from "@/context/auth";
import { useDialogState } from "@/hooks/useDialogState";
import { apiClient } from "@/lib/api-client";
import {
  cn,
  formatDate,
  getInitials,
  hasAccess,
  resolveImageEntry,
  stripHtml,
  uploadFileToR2,
} from "@/lib/utils";

function useColumns(
  onEdit: (project: Project) => void,
  onDelete: (project: Project) => void
): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("title")}</span>
          {row.original.isPinned && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Pin className="size-3.5 text-primary" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Pinned project</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row.original.activeMembersOnly && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Users className="size-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Active members only</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {stripHtml(row.getValue<string>("description"))}
        </span>
      ),
    },
    {
      accessorKey: "startingAt",
      header: "Starting",
      cell: ({ row }) => {
        const start = formatDate(row.getValue<string>("startingAt"));
        const end = row.original.endingAt;
        return (
          <span className="text-sm text-muted-foreground">
            {end ? `${start} – ${formatDate(end)}` : start}
          </span>
        );
      },
    },
    {
      accessorKey: "registrationOpensAt",
      header: "Registration Opens",
      cell: ({ row }) => {
        const val = row.getValue<string | null>("registrationOpensAt");
        return val ? (
          <span className="text-sm text-muted-foreground">{formatDate(val)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />
      ),
    },
  ];
}

interface ProjectRegistrationsDrawerProps {
  project: Project | undefined;
  onClose: () => void;
}

function CertificateCell({ reg, onRefresh }: { reg: ProjectRegistration; onRefresh: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: saveCert, isPending: isSaving } = useMutation({
    mutationFn: (body: { url: string; filename: string }) =>
      apiClient.post(ApiRoutes.ADMIN_REGISTRATION_CERTIFICATE.replace(":id", reg.id), body),
    onSuccess: () => {
      setError(null);
      onRefresh();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: deleteCert, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      apiClient.delete(ApiRoutes.ADMIN_REGISTRATION_CERTIFICATE.replace(":id", reg.id)),
    onSuccess: () => {
      setError(null);
      onRefresh();
    },
    onError: (err) => setError(err.message),
  });

  const isWorking = uploading || isSaving;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploadRoute = ApiRoutes.ADMIN_REGISTRATION_CERTIFICATE_UPLOAD.replace(":id", reg.id);
      const fileUrl = await uploadFileToR2(file, uploadRoute);
      saveCert({ url: fileUrl, filename: file.name });
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (reg.certificateUrl) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
          <a
            href={reg.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={reg.certificateFilename ?? undefined}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Award className="size-3" />
            Certificate
          </a>
          <button
            onClick={() => deleteCert()}
            disabled={isDeleting}
            className="ml-1 rounded p-0.5 text-muted-foreground hover:text-destructive"
            aria-label="Remove certificate"
          >
            <X className="size-3" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Replace certificate"
          >
            <Upload className="size-3" />
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isWorking}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Upload className="size-3" />
        {isWorking ? "Uploading..." : "Upload certificate"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}

function CapacitySummary({
  project,
  packages,
  registrationCount,
}: {
  project: Project;
  packages: ProjectPackage[];
  registrationCount: number;
}) {
  if (packages.length === 0) {
    const max = project.maxParticipants;
    if (max === null) {
      return (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{registrationCount}</span> registered ·
          Unlimited capacity
        </p>
      );
    }
    const available = Math.max(0, max - registrationCount);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{registrationCount}</span> / {max}{" "}
            registered
          </span>
          <span
            className={cn(
              "font-medium",
              available === 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {available === 0 ? "Full" : `${available} left`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              available === 0 ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, (registrationCount / max) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  type CapacityRow =
    | { kind: "package"; pkg: ProjectPackage }
    | {
        kind: "pool";
        poolId: string;
        poolName: string | null;
        poolMax: number;
        availableSpots: number | null;
        pkgs: ProjectPackage[];
      };

  const seenPools = new Set<string>();
  const rows: CapacityRow[] = [];

  for (const pkg of packages) {
    if (pkg.capacityPoolId) {
      if (!seenPools.has(pkg.capacityPoolId)) {
        seenPools.add(pkg.capacityPoolId);
        rows.push({
          kind: "pool",
          poolId: pkg.capacityPoolId,
          poolName: pkg.capacityPoolName,
          poolMax: pkg.capacityPoolMax ?? 0,
          availableSpots: pkg.availableSpots,
          pkgs: packages.filter((p) => p.capacityPoolId === pkg.capacityPoolId),
        });
      }
    } else {
      rows.push({ kind: "package", pkg });
    }
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        if (row.kind === "pool") {
          const registered = row.availableSpots !== null ? row.poolMax - row.availableSpots : null;
          const full = row.availableSpots === 0;
          const pct =
            registered !== null && row.poolMax > 0
              ? Math.min(100, (registered / row.poolMax) * 100)
              : 0;
          return (
            <div key={row.poolId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{row.poolName ?? "Shared pool"}</span>
                <span className="tabular-nums text-muted-foreground">
                  {registered !== null ? `${registered} / ${row.poolMax}` : `— / ${row.poolMax}`}
                  {" · "}
                  <span
                    className={cn(
                      "font-medium",
                      full ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {full
                      ? "Full"
                      : row.availableSpots !== null
                        ? `${row.availableSpots} left`
                        : "Unlimited"}
                  </span>
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    full ? "bg-destructive" : "bg-primary"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {row.pkgs.map((p) => p.name).join(", ")}
              </p>
            </div>
          );
        }

        const { pkg } = row;
        if (pkg.availableSpots === null) {
          return (
            <div key={pkg.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{pkg.name}</span>
              <span className="text-muted-foreground">Unlimited</span>
            </div>
          );
        }
        const max = pkg.maxParticipants ?? 0;
        const registered = max - pkg.availableSpots;
        const full = pkg.availableSpots === 0;
        const pct = max > 0 ? Math.min(100, (registered / max) * 100) : 0;
        return (
          <div key={pkg.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{pkg.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {registered} / {max}
                {" · "}
                <span
                  className={cn(
                    "font-medium",
                    full ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {full ? "Full" : `${pkg.availableSpots} left`}
                </span>
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  full ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectRegistrationsDrawer({ project, onClose }: ProjectRegistrationsDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = hasAccess(user?.role ?? Role.USER, Role.SUPER_ADMIN);
  const isAdmin = hasAccess(user?.role ?? Role.USER, Role.ADMIN);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [packageFilter, setPackageFilter] = useState<string>("all");

  const registrationsQueryKey = queryKeys.admin.projectRegistrations(project?.id ?? "");

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: [...registrationsQueryKey, packageFilter],
    queryFn: () => {
      const base = ApiRoutes.ADMIN_PROJECT_REGISTRATIONS.replace(":id", project!.id);
      const url = packageFilter !== "all" ? `${base}?packageId=${packageFilter}` : base;
      return apiClient.get<ProjectRegistration[]>(url);
    },
    enabled: !!project,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
    enabled: isSuperAdmin && !!project,
  });

  const { data: packages = [], isLoading: isPackagesLoading } = useQuery<ProjectPackage[]>({
    queryKey: queryKeys.admin.projectPackages(project?.id ?? ""),
    queryFn: () =>
      apiClient.get<ProjectPackage[]>(ApiRoutes.ADMIN_PROJECT_PACKAGES.replace(":id", project!.id)),
    enabled: !!project,
  });

  const { mutate: toggleAttended } = useMutation({
    mutationFn: ({ id, attended }: { id: string; attended: boolean }) =>
      apiClient.patch(ApiRoutes.ADMIN_PROJECT_REGISTRATION_BY_ID.replace(":id", id), { attended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: registrationsQueryKey }),
    onError: (err) => setDrawerError(err.message),
  });

  const { mutate: addRegistration, isPending: isAdding } = useMutation({
    mutationFn: ({ userId, packageId }: { userId: string; packageId: string | null }) =>
      apiClient.post(ApiRoutes.ADMIN_PROJECT_REGISTRATIONS.replace(":id", project!.id), {
        userId,
        ...(packageId && { packageId }),
      }),
    onSuccess: () => {
      setSelectedUserId("");
      setSelectedPackageId("");
      setDrawerError(null);
      queryClient.invalidateQueries({ queryKey: registrationsQueryKey });
    },
    onError: (err) => setDrawerError(err.message),
  });

  const { mutate: deleteRegistration } = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(ApiRoutes.ADMIN_PROJECT_REGISTRATION_BY_ID.replace(":id", id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: registrationsQueryKey }),
    onError: (err) => setDrawerError(err.message),
  });

  const registeredUserIds = new Set(registrations.map((r) => r.userId));
  const availableUsers = allUsers.filter((u) => !registeredUserIds.has(u.id));

  const hasPackages = packages.length > 0;

  useEffect(() => {
    setDrawerError(null);
    setSelectedUserId("");
    setSelectedPackageId("");
    setPackageFilter("all");
  }, [project?.id]);

  return (
    <Sheet open={!!project} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Participants
          </SheetTitle>
          <SheetDescription>{project?.title}</SheetDescription>
        </SheetHeader>

        {project && project.registrationOpensAt && !isLoading && !isPackagesLoading && (
          <div className="border-b px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Capacity
            </p>
            <CapacitySummary
              project={project}
              packages={packages}
              registrationCount={registrations.length}
            />
          </div>
        )}

        {isSuperAdmin && (
          <div className="flex flex-col gap-2 border-b p-4">
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add participant..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No users to add
                    </SelectItem>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                disabled={!selectedUserId || (hasPackages && !selectedPackageId) || isAdding}
                onClick={() =>
                  selectedUserId &&
                  addRegistration({ userId: selectedUserId, packageId: selectedPackageId || null })
                }
              >
                <UserPlus className="size-4" />
              </Button>
            </div>
            {hasPackages && (
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package..." />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {hasPackages && (
          <div className="border-b px-4 py-2">
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All packages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All packages</SelectItem>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {drawerError && <p className="px-4 py-2 text-xs text-destructive">{drawerError}</p>}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading...</p>
          ) : registrations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No participants yet.</p>
          ) : (
            <ul className="divide-y">
              {registrations.map((reg) => (
                <li key={reg.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {getInitials(reg.userName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{reg.userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{reg.userEmail}</p>
                    {reg.userIndex && (
                      <p className="text-xs text-muted-foreground">{reg.userIndex}</p>
                    )}
                    {reg.packageName && (
                      <p className="text-xs font-medium text-primary">{reg.packageName}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`attended-${reg.id}`}
                        checked={reg.attended}
                        onCheckedChange={(checked) =>
                          toggleAttended({ id: reg.id, attended: checked })
                        }
                      />
                      <label
                        htmlFor={`attended-${reg.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Attended
                      </label>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteRegistration(reg.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    {isAdmin && (
                      <CertificateCell
                        reg={reg}
                        onRefresh={() =>
                          queryClient.invalidateQueries({ queryKey: registrationsQueryKey })
                        }
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const dialog = useDialogState<Project>();
  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);
  const [drawerProject, setDrawerProject] = useState<Project | undefined>(undefined);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.projects(),
    queryFn: () => apiClient.get<Project[]>(ApiRoutes.ADMIN_PROJECTS),
  });

  const pinnedProject = projects.find((p) => p.isPinned);

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: async ({
      payload,
      images,
      draftPackages,
      draftPools,
    }: {
      payload: Omit<ProjectFormValues, "imageUrls">;
      images: ActiveImageEntry[];
      draftPackages: DraftPackage[];
      draftPools: DraftCapacityPool[];
    }) => {
      const imageUrls: string[] = [];
      for (const img of images) {
        const url = await resolveImageEntry(img, ApiRoutes.ADMIN_PROJECTS_UPLOAD);
        if (url) imageUrls.push(url);
      }
      const project = await apiClient.post<Project>(ApiRoutes.ADMIN_PROJECTS, {
        ...payload,
        imageUrls,
      });

      // Create pools first, then packages
      const poolIdMap: Record<string, string> = {};
      for (const pool of draftPools) {
        const created = await apiClient.post<{ id: string }>(
          ApiRoutes.ADMIN_PROJECT_CAPACITY_POOLS.replace(":id", project.id),
          { name: pool.name, maxParticipants: pool.maxParticipants }
        );
        poolIdMap[pool._draftId] = created.id;
      }
      for (const [i, pkg] of draftPackages.entries()) {
        const capacityPoolId = pkg.capacityPoolDraftId
          ? (poolIdMap[pkg.capacityPoolDraftId] ?? null)
          : null;
        await apiClient.post(ApiRoutes.ADMIN_PROJECT_PACKAGES.replace(":id", project.id), {
          name: pkg.name,
          description: pkg.description,
          maxParticipants: capacityPoolId ? null : pkg.maxParticipants,
          capacityPoolId,
          order: i,
        });
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects() });
      dialog.close();
    },
  });

  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      id,
      payload,
      images,
    }: {
      id: string;
      payload: Omit<ProjectFormValues, "imageUrls">;
      images: ActiveImageEntry[];
    }) => {
      const imageUrls: string[] = [];
      for (const img of images) {
        const url = await resolveImageEntry(img, ApiRoutes.ADMIN_PROJECTS_UPLOAD);
        if (url) imageUrls.push(url);
      }
      return apiClient.patch<Project>(ApiRoutes.ADMIN_PROJECT_BY_ID.replace(":id", id), {
        ...payload,
        imageUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects() });
      dialog.close();
    },
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => apiClient.delete(ApiRoutes.ADMIN_PROJECT_BY_ID.replace(":id", id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects() });
      setDeletingProject(undefined);
    },
  });

  function handleSubmit(
    payload: Omit<ProjectFormValues, "imageUrls">,
    images: ActiveImageEntry[],
    draftPackages: DraftPackage[],
    draftPools: DraftCapacityPool[]
  ) {
    if (dialog.item) {
      updateProject({ id: dialog.item.id, payload, images });
    } else {
      createProject({ payload, images, draftPackages, draftPools });
    }
  }

  const columns = useColumns(dialog.open, setDeletingProject);

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={(table.getState().globalFilter as string) ?? ""}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value);
                table.setPageIndex(0);
              }}
              className="w-full pl-8 sm:w-64"
            />
          </div>
          <Button onClick={() => dialog.open()}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <DataTableEmptyRow colSpan={columns.length} message="No projects found." />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setDrawerProject(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <ProjectDialog
        open={dialog.isOpen}
        onOpenChange={(open) => !open && dialog.close()}
        project={dialog.item}
        pinnedProject={pinnedProject}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      <ProjectRegistrationsDrawer
        project={drawerProject}
        onClose={() => setDrawerProject(undefined)}
      />

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingProject?.title}</strong>? This action
              cannot be undone and will remove all associated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletingProject && deleteProject(deletingProject.id)}
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
