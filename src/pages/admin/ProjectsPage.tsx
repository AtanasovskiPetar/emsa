import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
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
import { Role } from "@/constants/enums";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type ProjectFormValues } from "@/constants/schemas";
import { type AdminUser, type Project, type ProjectRegistration } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { useDialogState } from "@/hooks/useDialogState";
import { apiClient } from "@/lib/api-client";
import { getInitials, hasAccess, stripHtml } from "@/lib/utils";

function useColumns(
  onEdit: (project: Project) => void,
  onDelete: (project: Project) => void
): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
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
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue<string>("startingAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "registrationOpensAt",
      header: "Registration Opens",
      cell: ({ row }) => {
        const val = row.getValue<string | null>("registrationOpensAt");
        return val ? (
          <span className="text-sm text-muted-foreground">
            {new Date(val).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

interface ProjectRegistrationsDrawerProps {
  project: Project | undefined;
  onClose: () => void;
}

function ProjectRegistrationsDrawer({ project, onClose }: ProjectRegistrationsDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = hasAccess(user?.role ?? Role.USER, Role.SUPER_ADMIN);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const registrationsQueryKey = queryKeys.admin.projectRegistrations(project?.id ?? "");

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: registrationsQueryKey,
    queryFn: () =>
      apiClient.get<ProjectRegistration[]>(
        ApiRoutes.ADMIN_PROJECT_REGISTRATIONS.replace(":id", project!.id)
      ),
    enabled: !!project,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
    enabled: isSuperAdmin && !!project,
  });

  const { mutate: toggleAttended } = useMutation({
    mutationFn: ({ id, attended }: { id: string; attended: boolean }) =>
      apiClient.patch(ApiRoutes.ADMIN_PROJECT_REGISTRATION_BY_ID.replace(":id", id), { attended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: registrationsQueryKey }),
    onError: (err) => setDrawerError(err.message),
  });

  const { mutate: addRegistration, isPending: isAdding } = useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(ApiRoutes.ADMIN_PROJECT_REGISTRATIONS.replace(":id", project!.id), { userId }),
    onSuccess: () => {
      setSelectedUserId("");
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

  useEffect(() => {
    setDrawerError(null);
    setSelectedUserId("");
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

        {isSuperAdmin && (
          <div className="flex gap-2 border-b p-4">
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
              disabled={!selectedUserId || isAdding}
              onClick={() => selectedUserId && addRegistration(selectedUserId)}
            >
              <UserPlus className="size-4" />
            </Button>
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
                  </div>
                  <div className="flex items-center gap-2">
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
                    </div>
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

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (body: ProjectFormValues) =>
      apiClient.post<Project>(ApiRoutes.ADMIN_PROJECTS, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects() });
      dialog.close();
    },
  });

  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProjectFormValues }) =>
      apiClient.patch<Project>(ApiRoutes.ADMIN_PROJECT_BY_ID.replace(":id", id), body),
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

  function handleSubmit(values: ProjectFormValues) {
    if (dialog.item) {
      updateProject({ id: dialog.item.id, body: values });
    } else {
      createProject(values);
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
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
