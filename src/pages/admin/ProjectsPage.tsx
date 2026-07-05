import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pin, Plus, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DataTableEmptyRow } from "@/components/admin/DataTableEmptyRow";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import {
  type DraftCapacityPool,
  type DraftPackage,
  ProjectDialog,
} from "@/components/admin/ProjectDialog";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes, PageRoutes } from "@/constants/routes";
import type { ProjectFormValues } from "@/constants/schemas";
import { type ActiveImageEntry, type Project } from "@/constants/types";
import { useDialogState } from "@/hooks/useDialogState";
import { apiClient } from "@/lib/api-client";
import { formatDate, resolveImageEntry, stripHtml } from "@/lib/utils";

const columns: ColumnDef<Project>[] = [
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
];

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dialog = useDialogState<Project>();

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

  function handleSubmit(
    payload: Omit<ProjectFormValues, "imageUrls">,
    images: ActiveImageEntry[],
    draftPackages: DraftPackage[],
    draftPools: DraftCapacityPool[]
  ) {
    createProject({ payload, images, draftPackages, draftPools });
  }

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
                  onClick={() =>
                    navigate(PageRoutes.ADMIN_PROJECT_DETAIL.replace(":id", row.original.id))
                  }
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
        pinnedProject={pinnedProject}
        onSubmit={handleSubmit}
        isPending={isCreating}
      />
    </div>
  );
}
