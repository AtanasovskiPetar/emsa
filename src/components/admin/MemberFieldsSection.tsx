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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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
import { Switch } from "@/components/ui/switch";
import { MemberFieldType } from "@/constants/enums";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type MemberFieldPayload, type UpdateMemberFieldPayload } from "@/constants/schemas";
import { type MemberFieldDefinition } from "@/constants/types";
import { useMemberFields } from "@/hooks/useMemberFields";
import { apiClient } from "@/lib/api-client";
import { slugifyFieldKey } from "@/lib/member-fields";

const TYPE_LABELS: Record<MemberFieldType, string> = {
  [MemberFieldType.TEXT]: "Text",
  [MemberFieldType.NUMBER]: "Number",
};

function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: MemberFieldDefinition;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
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
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        <code className="rounded bg-muted px-1 text-xs text-muted-foreground">{field.key}</code>
        <Badge variant="secondary">{TYPE_LABELS[field.type]}</Badge>
        {field.required && <Badge>Required</Badge>}
        {field.suggestions && <Badge variant="outline">Suggestions</Badge>}
      </div>
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
    </div>
  );
}

export function MemberFieldsSection() {
  const queryClient = useQueryClient();

  const [localFields, setLocalFields] = useState<MemberFieldDefinition[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; editing: MemberFieldDefinition | null }>({
    open: false,
    editing: null,
  });
  const [deletingField, setDeletingField] = useState<MemberFieldDefinition | null>(null);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [type, setType] = useState<MemberFieldType>(MemberFieldType.TEXT);
  const [required, setRequired] = useState(false);
  const [suggestions, setSuggestions] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: fieldsData = [], isLoading } = useMemberFields();

  useEffect(() => {
    setLocalFields(fieldsData);
  }, [fieldsData]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.memberFields() });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    queryClient.invalidateQueries({ queryKey: queryKeys.me() });
  }

  const { mutate: createField, isPending: isCreating } = useMutation({
    mutationFn: (payload: MemberFieldPayload) =>
      apiClient.post<MemberFieldDefinition>(ApiRoutes.ADMIN_MEMBER_FIELDS, payload),
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
    onError: (err: unknown) =>
      setSaveError(err instanceof Error ? err.message : "Failed to save field"),
  });

  const { mutate: updateField, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...payload }: UpdateMemberFieldPayload & { id: string }) =>
      apiClient.patch<MemberFieldDefinition>(
        ApiRoutes.ADMIN_MEMBER_FIELD_BY_ID.replace(":id", id),
        payload
      ),
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
    onError: (err: unknown) =>
      setSaveError(err instanceof Error ? err.message : "Failed to save field"),
  });

  const { mutate: deleteField } = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(ApiRoutes.ADMIN_MEMBER_FIELD_BY_ID.replace(":id", id)),
    onSuccess: invalidate,
  });

  const { mutate: reorderFields } = useMutation({
    mutationFn: (ids: string[]) => apiClient.patch(ApiRoutes.ADMIN_MEMBER_FIELDS_REORDER, { ids }),
    onSuccess: invalidate,
    onError: () => setLocalFields(fieldsData),
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderFields(reordered.map((f) => f.id));
      return reordered;
    });
  }

  function openAdd() {
    setLabel("");
    setKey("");
    setKeyEdited(false);
    setType(MemberFieldType.TEXT);
    setRequired(false);
    setSuggestions(false);
    setSaveError(null);
    setDialog({ open: true, editing: null });
  }

  function openEdit(field: MemberFieldDefinition) {
    setLabel(field.label);
    setKey(field.key);
    setKeyEdited(true);
    setType(field.type);
    setRequired(field.required);
    setSuggestions(field.suggestions);
    setSaveError(null);
    setDialog({ open: true, editing: field });
  }

  function closeDialog() {
    setDialog({ open: false, editing: null });
    setSaveError(null);
  }

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!dialog.editing && !keyEdited) {
      setKey(slugifyFieldKey(value));
    }
  }

  function handleSave() {
    setSaveError(null);
    if (dialog.editing) {
      updateField({ id: dialog.editing.id, label: label.trim(), required, suggestions });
    } else {
      createField({ key, label: label.trim(), type, required, suggestions });
    }
  }

  const isSaving = isCreating || isUpdating;
  const canSave = !!label.trim() && (!!dialog.editing || !!key.trim());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Member Fields</h3>
          <p className="text-sm text-muted-foreground">
            Custom profile fields members fill in. Required fields gate platform access.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="mr-1 size-4" />
          Add field
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading fields...</div>
      ) : localFields.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No member fields yet. Members only need name, email and password.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localFields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex max-w-2xl flex-col gap-2">
              {localFields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onEdit={() => openEdit(field)}
                  onDelete={() => setDeletingField(field)}
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
            <DialogTitle>{dialog.editing ? "Edit field" : "Add field"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                placeholder="e.g. Membership number"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-key">Key</Label>
              <Input
                id="field-key"
                placeholder="e.g. membershipNumber"
                value={key}
                disabled={!!dialog.editing}
                onChange={(e) => {
                  setKey(e.target.value);
                  setKeyEdited(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Used in CSV imports and exports. Cannot be changed later.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                disabled={!!dialog.editing}
                onValueChange={(value) => {
                  const t = value as MemberFieldType;
                  setType(t);
                  if (t === MemberFieldType.NUMBER) setSuggestions(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MemberFieldType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Required</Label>
                <p className="text-xs text-muted-foreground">
                  Members must fill this in to access the platform.
                </p>
              </div>
              <Switch checked={required} onCheckedChange={setRequired} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Autosuggest existing values while typing. Text fields only.
                </p>
              </div>
              <Switch
                checked={suggestions}
                disabled={type === MemberFieldType.NUMBER}
                onCheckedChange={setSuggestions}
              />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {dialog.editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingField}
        onOpenChange={(open) => {
          if (!open) setDeletingField(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete field</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &ldquo;{deletingField?.label}&rdquo; and its values from all
              member profiles. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingField) deleteField(deletingField.id);
                setDeletingField(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
