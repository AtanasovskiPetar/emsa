import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/admin/ImageUpload";
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
import { type PillarFormValues, pillarSchema } from "@/constants/schemas";
import { type AdminUser, type ImageEntry, type Pillar } from "@/constants/types";
import { usePillarLabels } from "@/hooks/usePillarLabels";

interface PillarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar?: Pillar;
  users: AdminUser[];
  onSubmit: (values: PillarFormValues, imageEntry: ImageEntry) => void;
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
  const { singular } = usePillarLabels();
  const [imageEntry, setImageEntry] = useState<ImageEntry>({ type: "none" });

  const form = useForm<PillarFormValues>({
    resolver: zodResolver(pillarSchema),
    values: pillar
      ? { name: pillar.name, description: pillar.description, directorId: pillar.directorId }
      : { name: "", description: "", directorId: "" },
  });

  useEffect(() => {
    setImageEntry(pillar?.imageUrl ? { type: "existing", url: pillar.imageUrl } : { type: "none" });
  }, [pillar]);

  function handleSubmit(values: PillarFormValues) {
    onSubmit(values, imageEntry);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pillar ? `Edit ${singular}` : `Create ${singular}`}</DialogTitle>
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
                    <Input placeholder={`${singular} name`} {...field} />
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
                    <Textarea placeholder={`${singular} description`} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image upload */}
            <div className="flex flex-col gap-2">
              <Label>Image</Label>
              <ImageUpload state={imageEntry} onChange={setImageEntry} />
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
              <Button type="submit" disabled={isPending}>
                {pillar ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
