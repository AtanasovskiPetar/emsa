import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiRoutes } from "@/constants/routes";
import { type PillarFormValues, pillarSchema } from "@/constants/schemas";
import { type AdminUser, type ImageEntry, type Pillar } from "@/constants/types";
import { getImageSrc, uploadImageToS3 } from "@/lib/utils";

interface PillarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar?: Pillar;
  users: AdminUser[];
  onSubmit: (values: PillarFormValues) => void;
  isPending: boolean;
}

export function PillarDialog({
  open,
  onOpenChange,
  pillar,
  users,
  onSubmit,
  isPending,
}: PillarDialogProps) {
  const [imageEntry, setImageEntry] = useState<ImageEntry>({ type: "none" });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PillarFormValues>({
    resolver: zodResolver(pillarSchema),
    values: pillar
      ? { name: pillar.name, description: pillar.description, directorId: pillar.directorId }
      : { name: "", description: "", directorId: "" },
  });

  useEffect(() => {
    setImageEntry(pillar?.imageUrl ? { type: "existing", url: pillar.imageUrl } : { type: "none" });
  }, [pillar]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageEntry.type === "new") URL.revokeObjectURL(imageEntry.previewUrl);
    setImageEntry({ type: "new", file, previewUrl: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function handleRemoveImage() {
    if (imageEntry.type === "new") URL.revokeObjectURL(imageEntry.previewUrl);
    setImageEntry({ type: "none" });
  }

  async function handleSubmit(values: PillarFormValues) {
    try {
      setIsUploading(true);
      const imageUrl =
        imageEntry.type === "new"
          ? await uploadImageToS3(imageEntry.file, ApiRoutes.ADMIN_PILLARS_UPLOAD)
          : imageEntry.type === "existing"
            ? imageEntry.url
            : null;
      onSubmit({ ...values, imageUrl });
    } finally {
      setIsUploading(false);
    }
  }

  const imageSrc = getImageSrc(imageEntry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pillar ? "Edit Pillar" : "Create Pillar"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pillar name" {...field} />
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
                    <Textarea placeholder="Pillar description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image upload */}
            <div className="flex flex-col gap-2">
              <Label>Image</Label>
              {imageSrc ? (
                <div className="group relative w-fit">
                  <img
                    src={imageSrc}
                    alt="Pillar"
                    className="h-24 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-36 cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <ImagePlus className="size-5" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <FormField
              control={form.control}
              name="directorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Director</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a director" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending || isUploading}>
                {pillar ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
