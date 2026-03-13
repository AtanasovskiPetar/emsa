import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ApiRoutes } from "@/constants/routes";
import { type UpdateUserPayload } from "@/constants/schemas";
import { type AdminUser } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { getPageNumbers } from "@/lib/utils";

const ROLE_LABELS: Record<Role, string> = {
  [Role.USER]: "User",
  [Role.ADMIN]: "Admin",
  [Role.SUPER_ADMIN]: "Super Admin",
};

const ROLE_BADGE_VARIANT: Record<Role, "default" | "secondary" | "outline"> = {
  [Role.USER]: "outline",
  [Role.ADMIN]: "secondary",
  [Role.SUPER_ADMIN]: "default",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function useColumns(
  updateUser: (args: { id: string; payload: UpdateUserPayload }) => void
): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={row.original.name} imageUrl={row.original.imageUrl} className="size-7" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("email")}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue<Role>("role");
        return (
          <Select
            value={role}
            onValueChange={(value) =>
              updateUser({ id: row.original.id, payload: { role: value as Role } })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue>
                <Badge variant={ROLE_BADGE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(Role).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "activeMember",
      header: "Active Member",
      cell: ({ row }) => (
        <Switch
          checked={row.getValue("activeMember")}
          onCheckedChange={(checked) =>
            updateUser({ id: row.original.id, payload: { activeMember: checked } })
          }
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue<string>("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
  ];
}

export function UsersPage() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      apiClient.patch<AdminUser>(`${ApiRoutes.ADMIN_USERS}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const columns = useColumns(updateUser);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize: PAGE_SIZE_OPTIONS[0] } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalPages = table.getPageCount();
  const currentPage = pageIndex + 1;


  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {users.length} users
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(e) => {
              table.setGlobalFilter(e.target.value);
              table.setPageIndex(0);
            }}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
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
                  No users found.
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(totalPages, currentPage).map((n, i) =>
                n === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={n}>
                    <PaginationLink
                      isActive={n === currentPage}
                      onClick={() => table.setPageIndex(n - 1)}
                      className="cursor-pointer"
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
