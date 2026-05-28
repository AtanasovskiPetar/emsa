import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UniversityCombobox } from "@/components/UniversityCombobox";
import { UserAvatar } from "@/components/UserAvatar";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type UpdateMePayload, updateMeSchema } from "@/constants/schemas";
import { type ImageEntry, type UserProfile } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";
import { getImageSrc, resolveImageEntry } from "@/lib/utils";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function getMissingFields(profile: UserProfile): string[] {
  return [
    !profile.phone?.trim() && "Phone number",
    !profile.index?.trim() && "Student index",
    !profile.yearOfStudies && "Year of studies",
  ].filter(Boolean) as string[];
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { logout, updateUser, login, user } = useAuth();
  const [imageEntry, setImageEntry] = useState<ImageEntry>({ type: "none" });

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.get<UserProfile>(ApiRoutes.USERS_ME),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { mutate: updateMe, isPending } = useMutation({
    mutationFn: async ({
      imageEntry: img,
      ...values
    }: UpdateMePayload & { imageEntry: ImageEntry }) => {
      const imageUrl = await resolveImageEntry(img, ApiRoutes.UPLOAD_PRESIGNED);
      return apiClient.patch<UserProfile & { token?: string }>(ApiRoutes.USERS_ME, {
        ...values,
        imageUrl,
      });
    },
    onSuccess: ({ token, ...updated }) => {
      if (token) {
        login(token);
      } else {
        updateUser({
          name: updated.name,
          imageUrl: updated.imageUrl,
          profileCompleted: updated.profileCompleted,
        });
      }
      queryClient.setQueryData(queryKeys.me(), updated);
    },
  });

  const form = useForm<UpdateMePayload>({
    resolver: zodResolver(updateMeSchema),
  });

  useEffect(() => {
    if (!profile) return;
    setImageEntry(
      profile.imageUrl ? { type: "existing", url: profile.imageUrl } : { type: "none" }
    );
    form.reset({
      name: profile.name,
      phone: profile.phone,
      index: profile.index,
      yearOfStudies: profile.yearOfStudies,
      university: profile.university,
    });
  }, [profile, form]);

  function handleSubmit(values: UpdateMePayload) {
    updateMe({ ...values, imageEntry });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const missingFields = getMissingFields(profile);
  const isComplete = user?.profileCompleted ?? profile.profileCompleted;

  return (
    <div className="relative">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 size-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 size-[400px] translate-y-1/4 -translate-x-1/4 rounded-full bg-chart-2/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-lg space-y-6 px-4 py-10">
        {/* Header */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="flex items-start justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              name={profile.name}
              imageUrl={getImageSrc(imageEntry)}
              className="size-14 shrink-0 text-xl"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">{profile.name}</h1>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={logout}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </motion.div>

        {/* Profile status banner */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, ease: "easeOut" as const, delay: 0.08 }}
        >
          {isComplete ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/20">
              <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Your profile is complete
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Profile incomplete
                  </p>
                  <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-500">
                    Fill in the following to unlock full access:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {missingFields.map((field) => (
                      <li
                        key={field}
                        className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-500"
                      >
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Avatar card */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, ease: "easeOut" as const, delay: 0.16 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Profile photo</CardTitle>
              <CardDescription>JPG, PNG or WebP. Max 5 MB.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                state={imageEntry}
                onChange={setImageEntry}
                variant="avatar"
                name={profile.name}
                maxSizeBytes={5 * 1024 * 1024}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal info card */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, ease: "easeOut" as const, delay: 0.24 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>
                {isComplete
                  ? "Update your details below"
                  : "Complete the required fields to access the platform"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone {!profile.phone && <span className="text-amber-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="+1 234 567 8900"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="index"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Student index{" "}
                          {!profile.index && <span className="text-amber-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="123456" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearOfStudies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Year of studies{" "}
                          {!profile.yearOfStudies && <span className="text-amber-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 3"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University</FormLabel>
                        <FormControl>
                          <UniversityCombobox value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
