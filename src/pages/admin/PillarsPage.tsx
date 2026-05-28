import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { DataTableEmptyRow } from "@/components/admin/DataTableEmptyRow";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { PillarDialog } from "@/components/admin/PillarDialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type PillarFormValues } from "@/constants/schemas";
import { type AdminUser, type ImageEntry, type Pillar } from "@/constants/types";
import { useDialogState } from "@/hooks/useDialogState";
import { apiClient } from "@/lib/api-client";
import { formatDate, resolveImageEntry } from "@/lib/utils";

function useColumns(
  onEdit: (pillar: Pillar) => void,
  onDelete: (pillar: Pillar) => void
): ColumnDef<Pillar>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {row.getValue("description")}
        </span>
      ),
    },
    {
      accessorKey: "directorName",
      header: "Director",
      cell: ({ row }) => <span className="text-sm">{row.getValue("directorName") ?? "—"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue<string>("createdAt"))}
        </span>
      ),
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

export function PillarsPage() {
  const queryClient = useQueryClient();
  const dialog = useDialogState<Pillar>();
  const [deletingPillar, setDeletingPillar] = useState<Pillar | undefined>(undefined);

  const { data: pillars = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.pillars(),
    queryFn: () => apiClient.get<Pillar[]>(ApiRoutes.ADMIN_PILLARS),
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
  });

  const { mutate: createPillar, isPending: isCreating } = useMutation({
    mutationFn: async ({
      values,
      imageEntry,
    }: {
      values: PillarFormValues;
      imageEntry: ImageEntry;
    }) => {
      const imageUrl = await resolveImageEntry(imageEntry, ApiRoutes.ADMIN_PILLARS_UPLOAD);
      return apiClient.post<Pillar>(ApiRoutes.ADMIN_PILLARS, { ...values, imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pillars() });
      dialog.close();
    },
  });

  const { mutate: updatePillar, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      id,
      values,
      imageEntry,
    }: {
      id: string;
      values: PillarFormValues;
      imageEntry: ImageEntry;
    }) => {
      const imageUrl = await resolveImageEntry(imageEntry, ApiRoutes.ADMIN_PILLARS_UPLOAD);
      return apiClient.patch<Pillar>(`${ApiRoutes.ADMIN_PILLARS}/${id}`, { ...values, imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pillars() });
      dialog.close();
    },
  });

  const { mutate: deletePillar, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ApiRoutes.ADMIN_PILLARS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pillars() });
      setDeletingPillar(undefined);
    },
  });

  function handleSubmit(values: PillarFormValues, imageEntry: ImageEntry) {
    if (dialog.item) {
      updatePillar({ id: dialog.item.id, values, imageEntry });
    } else {
      createPillar({ values, imageEntry });
    }
  }

  const columns = useColumns(dialog.open, setDeletingPillar);

  const table = useReactTable({
    data: pillars,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading pillars...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pillars</h2>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {pillars.length} pillars
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search pillars..."
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
            New Pillar
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
              <DataTableEmptyRow colSpan={columns.length} message="No pillars found." />
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

      <PillarDialog
        open={dialog.isOpen}
        onOpenChange={(open) => !open && dialog.close()}
        pillar={dialog.item}
        users={users}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      <AlertDialog
        open={!!deletingPillar}
        onOpenChange={(open) => !open && setDeletingPillar(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pillar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingPillar?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletingPillar && deletePillar(deletingPillar.id)}
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
