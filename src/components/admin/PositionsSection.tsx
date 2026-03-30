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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/UserAvatar";
import { Role } from "@/constants/enums";
import { ApiRoutes } from "@/constants/routes";
import { type AdminUser, type Position } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { hasAccess } from "@/lib/utils";

function SortablePositionItem({
  position,
  isSuperAdmin,
  onEdit,
  onDelete,
}: {
  position: Position;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: position.id,
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
        <UserAvatar name={position.userName} imageUrl={position.userImageUrl} className="size-7" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{position.title}</span>
          <span className="text-xs text-muted-foreground">{position.userName}</span>
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

export function PositionsSection() {
  const { user } = useAuth();
  const isSuperAdmin = !!user && hasAccess(user.role, Role.SUPER_ADMIN);
  const queryClient = useQueryClient();

  const [localPositions, setLocalPositions] = useState<Position[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Position | null }>({
    open: false,
    editing: null,
  });
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState("");

  const { data: positionsData = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiClient.get<Position[]>(ApiRoutes.POSITIONS),
  });

  useEffect(() => {
    setLocalPositions(positionsData);
  }, [positionsData]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get<AdminUser[]>(ApiRoutes.ADMIN_USERS),
  });

  const { mutate: createPosition, isPending: isCreating } = useMutation({
    mutationFn: (payload: { title: string; userId: string }) =>
      apiClient.post<Position>(ApiRoutes.ADMIN_POSITIONS, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });

  const { mutate: updatePosition, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title: string; userId: string }) =>
      apiClient.patch<Position>(`${ApiRoutes.ADMIN_POSITIONS}/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });

  const { mutate: deletePosition } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ApiRoutes.ADMIN_POSITIONS}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });

  const { mutate: reorderPositions } = useMutation({
    mutationFn: (ids: string[]) => apiClient.patch(ApiRoutes.ADMIN_POSITIONS_REORDER, { ids }),
    onError: () => setLocalPositions(positionsData),
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalPositions((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderPositions(reordered.map((p) => p.id));
      return reordered;
    });
  }

  function openAdd() {
    setTitle("");
    setUserId("");
    setDialog({ open: true, editing: null });
  }

  function openEdit(position: Position) {
    setTitle(position.title);
    setUserId(position.userId);
    setDialog({ open: true, editing: position });
  }

  function closeDialog() {
    setDialog({ open: false, editing: null });
    setTitle("");
    setUserId("");
  }

  function handleSave() {
    if (!title.trim() || !userId) return;
    if (dialog.editing) {
      updatePosition({ id: dialog.editing.id, title: title.trim(), userId });
    } else {
      createPosition({ title: title.trim(), userId });
    }
    closeDialog();
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Board Positions</h3>
          <p className="text-sm text-muted-foreground">
            Manage organization positions and their holders.
          </p>
        </div>
        {isSuperAdmin && (
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Add position
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading positions...</div>
      ) : localPositions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No positions yet.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localPositions.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex max-w-2xl flex-col gap-2">
              {localPositions.map((position) => (
                <SortablePositionItem
                  key={position.id}
                  position={position}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={() => openEdit(position)}
                  onDelete={() => deletePosition(position.id)}
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
            <DialogTitle>{dialog.editing ? "Edit position" : "Add position"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="position-title">Title</Label>
              <Input
                id="position-title"
                placeholder="e.g. President"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>User</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !userId || isSaving}>
              {dialog.editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
