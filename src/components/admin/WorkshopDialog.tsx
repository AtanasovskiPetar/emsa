import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import type { WorkshopFormValues } from "@/constants/schemas";
import type { Workshop } from "@/constants/types";
import { toDatetimeLocalValue } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startingAt: z.string().min(1, "Starting date is required"),
  endingAt: z.string().nullable().optional(),
  registrationOpensAt: z.string().nullable().optional(),
  registrationClosesAt: z.string().nullable().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkshopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop?: Workshop;
  onSubmit: (values: WorkshopFormValues) => void;
  isPending: boolean;
}

export function WorkshopDialog({
  open,
  onOpenChange,
  workshop,
  onSubmit,
  isPending,
}: WorkshopDialogProps) {
  const isEdit = !!workshop;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startingAt: "",
      endingAt: null,
      registrationOpensAt: null,
      registrationClosesAt: null,
      maxParticipants: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (workshop) {
        form.reset({
          title: workshop.title,
          description: workshop.description ?? "",
          startingAt: toDatetimeLocalValue(workshop.startingAt),
          endingAt: workshop.endingAt ? toDatetimeLocalValue(workshop.endingAt) : null,
          registrationOpensAt: workshop.registrationOpensAt
            ? toDatetimeLocalValue(workshop.registrationOpensAt)
            : null,
          registrationClosesAt: workshop.registrationClosesAt
            ? toDatetimeLocalValue(workshop.registrationClosesAt)
            : null,
          maxParticipants: workshop.maxParticipants ?? null,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          startingAt: "",
          endingAt: null,
          registrationOpensAt: null,
          registrationClosesAt: null,
          maxParticipants: null,
        });
      }
    }
  }, [open, workshop, form]);

  const registrationOpensAt = form.watch("registrationOpensAt");
  const hasRegistration = !!registrationOpensAt;

  function handleSubmit(values: FormValues) {
    onSubmit({
      title: values.title,
      description: values.description ?? "",
      startingAt: new Date(values.startingAt).toISOString(),
      endingAt: values.endingAt ? new Date(values.endingAt).toISOString() : null,
      registrationOpensAt: values.registrationOpensAt
        ? new Date(values.registrationOpensAt).toISOString()
        : null,
      registrationClosesAt: values.registrationClosesAt
        ? new Date(values.registrationClosesAt).toISOString()
        : null,
      maxParticipants: values.maxParticipants ?? null,
    });
  }

  function clearRegistration() {
    form.setValue("registrationOpensAt", null);
    form.setValue("registrationClosesAt", null);
    form.setValue("maxParticipants", null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Workshop" : "New Workshop"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Workshop title" {...field} />
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
                    <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startingAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting At</FormLabel>
                    <FormControl>
                      <DateTimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endingAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ending At</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Registration</p>
                {hasRegistration && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={clearRegistration}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="registrationOpensAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opens At</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationClosesAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closes At</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v || null)}
                          disabled={!hasRegistration}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                        disabled={!hasRegistration}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Workshop"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
