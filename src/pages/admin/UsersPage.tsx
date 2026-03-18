import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { EllipsisVertical, Search } from "lucide-react";
import { useState } from "react";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/UserAvatar";
import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { type UpdateUserPayload } from "@/constants/schemas";
import { type AdminUser } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { hasAccess } from "@/lib/utils";

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

function defaultActiveUntil(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function useColumns(
  updateUser: (args: { id: string; payload: UpdateUserPayload }) => void,
  onEditDate: (user: AdminUser) => void,
  isSuperAdmin: boolean
): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserAvatar
            name={row.original.name}
            imageUrl={row.original.imageUrl}
            className="size-7"
          />
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
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue<string | null>("phone") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "index",
      header: "Index",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue<string | null>("index") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "yearOfStudies",
      header: "Year",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue<number | null>("yearOfStudies") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "profileCompleted",
      header: "Profile",
      cell: ({ row }) =>
        row.getValue<boolean>("profileCompleted") ? (
          <Badge className="bg-green-500 text-white hover:bg-green-500">Complete</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Incomplete
          </Badge>
        ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue<Role>("role");
        if (!isSuperAdmin) {
          return <Badge variant={ROLE_BADGE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>;
        }
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
      accessorKey: "isActive",
      header: "Membership",
      filterFn: (row, _columnId, filterValue: boolean | undefined) => {
        if (filterValue === undefined) return true;
        return row.original.isActive === filterValue;
      },
      cell: ({ row }) => {
        const { isActive, activeUntil } = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              {isActive ? (
                <Badge className="bg-green-500 text-white hover:bg-green-500">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
              {isSuperAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5">
                      <EllipsisVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {isActive ? (
                      <>
                        <DropdownMenuItem onClick={() => onEditDate(row.original)}>
                          Edit date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            updateUser({ id: row.original.id, payload: { activeUntil: null } })
                          }
                        >
                          Deactivate
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => onEditDate(row.original)}>
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {activeUntil && (
              <span className="text-xs text-muted-foreground">
                {isActive ? "until" : "expired"} {new Date(activeUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      },
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
  const { user } = useAuth();
  const isSuperAdmin = !!user && hasAccess(user.role, Role.SUPER_ADMIN);
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [activeUntilDate, setActiveUntilDate] = useState<Date | undefined>(defaultActiveUntil);

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

  function handleOpenEdit(targetUser: AdminUser) {
    setActiveUntilDate(
      targetUser.activeUntil ? new Date(targetUser.activeUntil) : defaultActiveUntil()
    );
    setEditingUser(targetUser);
  }

  function handleConfirm() {
    if (!editingUser || !activeUntilDate) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${activeUntilDate.getFullYear()}-${pad(activeUntilDate.getMonth() + 1)}-${pad(activeUntilDate.getDate())}`;
    updateUser({ id: editingUser.id, payload: { activeUntil: dateStr } });
    setEditingUser(null);
    setActiveUntilDate(defaultActiveUntil());
  }

  const columns = useColumns(updateUser, handleOpenEdit, isSuperAdmin);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {users.length} users
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={
              table.getColumn("isActive")?.getFilterValue() === undefined
                ? "all"
                : table.getColumn("isActive")?.getFilterValue()
                  ? "active"
                  : "inactive"
            }
            onValueChange={(value) => {
              const filterValue = value === "all" ? undefined : value === "active" ? true : false;
              table.getColumn("isActive")?.setFilterValue(filterValue);
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={(table.getState().globalFilter as string) ?? ""}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value);
                table.setPageIndex(0);
              }}
              className="w-full pl-8 sm:w-64"
            />
          </div>
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

      <DataTablePagination table={table} />

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            setActiveUntilDate(defaultActiveUntil());
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingUser?.isActive ? "Edit membership" : "Activate membership"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <p className="text-sm text-muted-foreground">
              {editingUser?.isActive
                ? "Updating active membership for"
                : "Setting active membership for"}{" "}
              <span className="font-medium text-foreground">{editingUser?.name}</span>.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Active until</Label>
              <DatePicker
                value={activeUntilDate}
                onChange={setActiveUntilDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!activeUntilDate}>
              {editingUser?.isActive ? "Save" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
