import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { PillarDialog } from "@/components/admin/PillarDialog";
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
import { ApiRoutes } from "@/constants/routes";
import { type PillarFormValues } from "@/constants/schemas";
import { type AdminUser, type Pillar } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

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
          {new Date(row.getValue<string>("createdAt")).toLocaleDateString()}
        </span>
      ),
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

export function PillarsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | undefined>(undefined);
  const [deletingPillar, setDeletingPillar] = useState<Pillar | undefined>(undefined);

  const { data: pillars = [], isLoading } = useQuery({
    queryKey: ["admin", "pillars"],
    queryFn: () => apiClient.get<Pillar[]>(ApiRoutes.ADMIN_PILLARS),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
  });

  const { mutate: createPillar, isPending: isCreating } = useMutation({
    mutationFn: (body: PillarFormValues) => apiClient.post<Pillar>(ApiRoutes.ADMIN_PILLARS, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pillars"] });
      setDialogOpen(false);
    },
  });

  const { mutate: updatePillar, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PillarFormValues }) =>
      apiClient.patch<Pillar>(`${ApiRoutes.ADMIN_PILLARS}/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pillars"] });
      setDialogOpen(false);
    },
  });

  const { mutate: deletePillar, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ApiRoutes.ADMIN_PILLARS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pillars"] });
      setDeletingPillar(undefined);
    },
  });

  function handleEdit(pillar: Pillar) {
    setEditingPillar(pillar);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingPillar(undefined);
  }

  function handleSubmit(values: PillarFormValues) {
    if (editingPillar) {
      updatePillar({ id: editingPillar.id, body: values });
    } else {
      createPillar(values);
    }
  }

  const columns = useColumns(handleEdit, setDeletingPillar);

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
          <Button onClick={() => setDialogOpen(true)}>
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No pillars found.
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

      <PillarDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        pillar={editingPillar}
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
