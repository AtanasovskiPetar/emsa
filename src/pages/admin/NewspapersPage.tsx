import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { DataTablePagination } from "@/components/admin/DataTablePagination";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { type NewspaperFormValues } from "@/constants/schemas";
import { type Newspaper } from "@/constants/types";
import { useDialogState } from "@/hooks/useDialogState";
import { apiClient } from "@/lib/api-client";
import { uploadImageToS3 } from "@/lib/utils";

function useColumns(
  onEdit: (newspaper: Newspaper) => void,
  onDelete: (newspaper: Newspaper) => void
): ColumnDef<Newspaper>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "releaseDate",
      header: "Release Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue<string>("releaseDate")).toLocaleDateString()}
        </span>
      ),
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

interface NewspaperDialogProps {
  newspaper: Newspaper | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function NewspaperDialog({ newspaper, isOpen, onClose }: NewspaperDialogProps) {
  const queryClient = useQueryClient();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset } = useForm<NewspaperFormValues>({
    defaultValues: { title: "", pdfUrl: "" },
  });

  const releaseDateValue = watch("releaseDate");

  useEffect(() => {
    if (isOpen) {
      reset({
        title: newspaper?.title ?? "",
        pdfUrl: newspaper?.pdfUrl ?? "",
        releaseDate: newspaper?.releaseDate ?? "",
      });
      setPdfFile(null);
      setError(null);
    }
  }, [isOpen, newspaper, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: NewspaperFormValues) =>
      newspaper
        ? apiClient.patch(ApiRoutes.ADMIN_NEWSPAPER_BY_ID.replace(":id", newspaper.id), data)
        : apiClient.post(ApiRoutes.ADMIN_NEWSPAPERS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newspapers() });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  async function onSubmit(values: NewspaperFormValues) {
    setError(null);
    let finalPdfUrl = values.pdfUrl;

    if (pdfFile) {
      setIsUploading(true);
      try {
        finalPdfUrl = await uploadImageToS3(pdfFile, ApiRoutes.ADMIN_NEWSPAPERS_UPLOAD);
      } catch {
        setError("Failed to upload PDF. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (!finalPdfUrl) {
      setError("Please upload a PDF file.");
      return;
    }

    mutate({ ...values, pdfUrl: finalPdfUrl });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{newspaper ? "Edit Newspaper" : "New Newspaper"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="Newspaper title" />
          </div>

          <div className="space-y-2">
            <Label>Release Date</Label>
            <DatePicker
              value={releaseDateValue ? new Date(releaseDateValue) : undefined}
              onChange={(date) => setValue("releaseDate", date ? date.toISOString() : "")}
              placeholder="Pick a release date"
            />
          </div>

          <div className="space-y-2">
            <Label>PDF File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPdfFile(file);
              }}
            />
            {pdfFile ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex-1 truncate text-sm">{pdfFile.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 size-4" />
                  Replace
                </Button>
              </div>
            ) : newspaper?.pdfUrl ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-muted-foreground">Current PDF on file</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 size-4" />
                  Replace
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 size-4" />
                Upload PDF
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isUploading}>
              {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewspapersPage() {
  const queryClient = useQueryClient();
  const editDialog = useDialogState<Newspaper>();
  const deleteDialog = useDialogState<Newspaper>();

  const { data: newspapers = [], isLoading } = useQuery({
    queryKey: queryKeys.newspapers(),
    queryFn: () => apiClient.get<Newspaper[]>(ApiRoutes.NEWSPAPERS),
  });

  const { mutate: deleteNewspaper, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(ApiRoutes.ADMIN_NEWSPAPER_BY_ID.replace(":id", id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newspapers() });
      deleteDialog.close();
    },
  });

  const columns = useColumns(editDialog.open, deleteDialog.open);

  const table = useReactTable({
    data: newspapers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Newspapers</h1>
          <p className="text-sm text-muted-foreground">Manage published newspapers</p>
        </div>
        <Button onClick={() => editDialog.open()}>
          <Plus className="mr-2 size-4" />
          New Newspaper
        </Button>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No newspapers yet.
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

      <NewspaperDialog
        newspaper={editDialog.item}
        isOpen={editDialog.isOpen}
        onClose={editDialog.close}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && deleteDialog.close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Newspaper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.item?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => deleteDialog.item && deleteNewspaper(deleteDialog.item.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
