import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GripVertical, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiRoutes } from "@/constants/routes";
import { type ProjectFormValues } from "@/constants/schemas";
import { type ImageEntry, type Pillar, type Project } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { getImageId, getImageSrc, toDatetimeLocalValue, uploadImageToS3 } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  startingAt: z.string().min(1, "Starting date is required"),
  pillarId: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

type ActiveImageEntry = Exclude<ImageEntry, { type: "none" }>;

interface SortableImageProps {
  img: ActiveImageEntry;
  onRemove: () => void;
}

function SortableImage({ img, onRemove }: SortableImageProps) {
  const id = getImageId(img);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group relative aspect-square"
    >
      <img
        src={getImageSrc(img)!}
        alt=""
        className="size-full rounded-md border object-cover"
        draggable={false}
      />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 flex size-5 cursor-grab items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSubmit: (values: ProjectFormValues) => void;
  isPending: boolean;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  isPending,
}: ProjectDialogProps) {
  const { data: pillars = [] } = useQuery({
    queryKey: ["admin", "pillars"],
    queryFn: () => apiClient.get<Pillar[]>(ApiRoutes.ADMIN_PILLARS),
  });
  const [images, setImages] = useState<ActiveImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadImages, isPending: isUploading } = useMutation({
    mutationFn: async (imgs: ActiveImageEntry[]) => {
      const imageUrls: string[] = [];
      for (const img of imgs) {
        if (img.type === "existing") {
          imageUrls.push(img.url);
        } else {
          imageUrls.push(await uploadImageToS3(img.file, ApiRoutes.ADMIN_PROJECTS_UPLOAD));
        }
      }
      return imageUrls;
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: project
      ? {
          title: project.title,
          description: project.description,
          startingAt: toDatetimeLocalValue(project.startingAt),
          pillarId: project.pillarId ?? "none",
        }
      : { title: "", description: "", startingAt: "", pillarId: "none" },
  });

  useEffect(() => {
    if (open) {
      setImages(project?.images.map((url) => ({ type: "existing", url })) ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIndex = prev.findIndex((img) => getImageId(img) === active.id);
      const newIndex = prev.findIndex((img) => getImageId(img) === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        type: "new" as const,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const img = prev[index];
      if (img?.type === "new") URL.revokeObjectURL(img.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      images.forEach((img) => {
        if (img.type === "new") URL.revokeObjectURL(img.previewUrl);
      });
    }
    onOpenChange(open);
  }

  async function handleSubmit(values: FormValues) {
    try {
      const imageUrls = await uploadImages(images);
      onSubmit({
        title: values.title,
        description: values.description,
        startingAt: values.startingAt,
        pillarId: values.pillarId === "none" ? null : values.pillarId,
        imageUrls,
      });
    } catch {
      // upload failed, don't proceed
    }
  }

  const isSubmitting = isUploading || isPending;
  const imageIds = images.map(getImageId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-1">
          <Form {...form}>
            <form
              id="project-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startingAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pillarId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pillar</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No pillar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No pillar</SelectItem>
                          {pillars.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Images</span>
                {images.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={imageIds} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {images.map((img, i) => (
                          <SortableImage
                            key={getImageId(img)}
                            img={img}
                            onRemove={() => removeImage(i)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Add Images
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="pt-2">
          <Button type="submit" form="project-form" disabled={isSubmitting}>
            {isUploading
              ? "Uploading..."
              : isPending
                ? "Saving..."
                : project
                  ? "Save changes"
                  : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
