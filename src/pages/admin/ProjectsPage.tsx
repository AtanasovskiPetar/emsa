import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiRoutes } from "@/constants/routes";
import { type ProjectFormValues } from "@/constants/schemas";
import { type Project } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { stripHtml } from "@/lib/utils";

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
      accessorKey: "pillarName",
      header: "Pillar",
      cell: ({ row }) => {
        const name = row.getValue<string | null>("pillarName");
        return name ? (
          <Badge variant="outline">{name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "images",
      header: "Images",
      cell: ({ row }) => {
        const count = row.getValue<string[]>("images").length;
        return count > 0 ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <ImageIcon className="size-3.5" />
            {count}
          </div>
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
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => apiClient.get<Project[]>(ApiRoutes.ADMIN_PROJECTS),
  });

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (body: ProjectFormValues) =>
      apiClient.post<Project>(ApiRoutes.ADMIN_PROJECTS, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      setDialogOpen(false);
    },
  });

  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProjectFormValues }) =>
      apiClient.patch<Project>(`${ApiRoutes.ADMIN_PROJECTS}/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      setDialogOpen(false);
    },
  });

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ApiRoutes.ADMIN_PROJECTS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      setDeletingProject(undefined);
    },
  });

  function handleEdit(project: Project) {
    setEditingProject(project);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingProject(undefined);
  }

  function handleSubmit(values: ProjectFormValues) {
    if (editingProject) {
      updateProject({ id: editingProject.id, body: values });
    } else {
      createProject(values);
    }
  }

  const columns = useColumns(handleEdit, setDeletingProject);

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
          <Button onClick={() => setDialogOpen(true)}>
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
                <TableRow key={row.id}>
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
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        project={editingProject}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
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
