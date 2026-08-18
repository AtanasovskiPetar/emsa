import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Role } from "@/constants/enums";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { supporterSchema } from "@/constants/schemas";
import { type ImageEntry, type Supporter } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { hasAccess, resolveImageEntry } from "@/lib/utils";

const NO_SUPPORTERS: Supporter[] = [];

interface SupporterPayload {
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
}

function SortableSupporterItem({
  supporter,
  isSuperAdmin,
  onEdit,
  onDelete,
}: {
  supporter: Supporter;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: supporter.id,
    disabled: !isSuperAdmin,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 rounded-md border bg-card p-3"
    >
      {isSuperAdmin && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <div className="flex flex-1 items-center gap-3">
        <img
          src={supporter.logoUrl}
          alt={supporter.name}
          className="h-8 w-16 shrink-0 rounded border bg-white object-contain p-0.5"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{supporter.name}</span>
          {supporter.websiteUrl && (
            <span className="text-xs text-muted-foreground">{supporter.websiteUrl}</span>
          )}
        </div>
      </div>
      {isSuperAdmin && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function SupportersSection() {
  const { user } = useAuth();
  const isSuperAdmin = !!user && hasAccess(user.role, Role.SUPER_ADMIN);
  const queryClient = useQueryClient();

  const [localSupporters, setLocalSupporters] = useState<Supporter[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Supporter | null }>({
    open: false,
    editing: null,
  });
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logo, setLogo] = useState<ImageEntry>({ type: "none" });
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.supporters(),
    queryFn: () => apiClient.get<Supporter[]>(ApiRoutes.SUPPORTERS),
  });
  const supportersData = data ?? NO_SUPPORTERS;

  useEffect(() => {
    setLocalSupporters(supportersData);
  }, [supportersData]);

  const { mutate: createSupporter, isPending: isCreating } = useMutation({
    mutationFn: (payload: SupporterPayload) =>
      apiClient.post<Supporter>(ApiRoutes.ADMIN_SUPPORTERS, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supporters() });
      closeDialog();
    },
    onError: (error: Error) => setSaveError(error.message),
  });

  const { mutate: updateSupporter, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...payload }: SupporterPayload & { id: string }) =>
      apiClient.patch<Supporter>(`${ApiRoutes.ADMIN_SUPPORTERS}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supporters() });
      closeDialog();
    },
    onError: (error: Error) => setSaveError(error.message),
  });

  const { mutate: deleteSupporter } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ApiRoutes.ADMIN_SUPPORTERS}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.supporters() }),
  });

  const { mutate: reorderSupporters } = useMutation({
    mutationFn: (ids: string[]) => apiClient.patch(ApiRoutes.ADMIN_SUPPORTERS_REORDER, { ids }),
    onError: () => setLocalSupporters(supportersData),
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalSupporters((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderSupporters(reordered.map((s) => s.id));
      return reordered;
    });
  }

  function openAdd() {
    setName("");
    setWebsiteUrl("");
    setLogo({ type: "none" });
    setWebsiteError(null);
    setSaveError(null);
    setDialog({ open: true, editing: null });
  }

  function openEdit(supporter: Supporter) {
    setName(supporter.name);
    setWebsiteUrl(supporter.websiteUrl ?? "");
    setLogo({ type: "existing", url: supporter.logoUrl });
    setWebsiteError(null);
    setSaveError(null);
    setDialog({ open: true, editing: supporter });
  }

  function closeDialog() {
    setDialog({ open: false, editing: null });
    setName("");
    setWebsiteUrl("");
    setLogo({ type: "none" });
    setWebsiteError(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!name.trim() || logo.type === "none") return;
    setSaveError(null);

    const website = websiteUrl.trim();
    if (website) {
      const parsed = supporterSchema.shape.websiteUrl.safeParse(website);
      if (!parsed.success) {
        setWebsiteError(parsed.error.issues[0]?.message ?? "Must be a valid URL");
        return;
      }
    }
    setWebsiteError(null);

    let logoUrl: string | null;
    try {
      logoUrl = await resolveImageEntry(logo, ApiRoutes.ADMIN_SUPPORTERS_UPLOAD);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to upload logo");
      return;
    }
    if (!logoUrl) return;
    setLogo({ type: "existing", url: logoUrl });

    const payload: SupporterPayload = {
      name: name.trim(),
      logoUrl,
      websiteUrl: website || null,
    };

    if (dialog.editing) {
      updateSupporter({ id: dialog.editing.id, ...payload });
    } else {
      createSupporter(payload);
    }
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Supporters</h3>
          <p className="text-sm text-muted-foreground">
            Logos shown in the scrolling strip at the bottom of the homepage.
          </p>
        </div>
        {isSuperAdmin && (
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Add supporter
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading supporters...</div>
      ) : localSupporters.length === 0 ? (
        <div className="text-sm text-muted-foreground">No supporters yet.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localSupporters.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex max-w-2xl flex-col gap-2">
              {localSupporters.map((supporter) => (
                <SortableSupporterItem
                  key={supporter.id}
                  supporter={supporter}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={() => openEdit(supporter)}
                  onDelete={() => deleteSupporter(supporter.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit supporter" : "Add supporter"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supporter-name">Name</Label>
              <Input
                id="supporter-name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supporter-website">Website URL (optional)</Label>
              <Input
                id="supporter-website"
                placeholder="https://acme.com"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setWebsiteError(null);
                }}
                aria-invalid={!!websiteError}
              />
              {websiteError && <p className="text-sm text-destructive">{websiteError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Logo</Label>
              <ImageUpload state={logo} onChange={setLogo} variant="square" name={name} />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || logo.type === "none" || isSaving}
            >
              {dialog.editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
