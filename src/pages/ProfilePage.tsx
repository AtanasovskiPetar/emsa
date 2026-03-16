import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
import { UserAvatar } from "@/components/UserAvatar";
import { ApiRoutes } from "@/constants/routes";
import { ALLOWED_IMAGE_TYPES, type UpdateMePayload, updateMeSchema } from "@/constants/schemas";
import { type UserProfile } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function getMissingFields(profile: UserProfile): string[] {
  return [
    !profile.phone && "Phone number",
    !profile.index && "Student index",
    !profile.yearOfStudies && "Year of studies",
  ].filter(Boolean) as string[];
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { logout, updateUser, login, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<UserProfile>(ApiRoutes.USERS_ME),
  });

  const { mutate: updateMe, isPending } = useMutation({
    mutationFn: (payload: UpdateMePayload) =>
      apiClient.patch<UserProfile & { token?: string }>(ApiRoutes.USERS_ME, payload),
  });

  const form = useForm<UpdateMePayload>({
    resolver: zodResolver(updateMeSchema),
    values: profile
      ? {
          name: profile.name,
          phone: profile.phone ?? undefined,
          index: profile.index ?? undefined,
          yearOfStudies: profile.yearOfStudies ?? undefined,
        }
      : undefined,
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be 5MB or less.");
      return;
    }
    setFileError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(values: UpdateMePayload) {
    const payload: UpdateMePayload = {
      name: values.name,
      phone: values.phone,
      index: values.index,
      yearOfStudies: values.yearOfStudies,
    };

    if (pendingFile) {
      setIsUploading(true);
      try {
        const { uploadUrl, fileUrl } = await apiClient.get<{ uploadUrl: string; fileUrl: string }>(
          `${ApiRoutes.UPLOAD_PRESIGNED}?contentType=${encodeURIComponent(pendingFile.type)}`
        );
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: pendingFile,
          headers: { "Content-Type": pendingFile.type },
        });
        if (!res.ok) throw new Error("Upload failed");
        payload.imageUrl = fileUrl;
      } catch {
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    updateMe(payload, {
      onSuccess: ({ token, ...updated }) => {
        setPendingFile(null);
        setPreviewUrl(null);
        queryClient.setQueryData(["me"], updated);
        if (token) {
          login(token);
        } else {
          updateUser({
            name: updated.name,
            imageUrl: updated.imageUrl,
            profileCompleted: updated.profileCompleted,
          });
        }
      },
    });
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
          <div className="flex items-center gap-4">
            <UserAvatar
              name={profile.name}
              imageUrl={previewUrl ?? profile.imageUrl}
              className="size-14 text-xl"
            />
            <div>
              <h1 className="text-2xl font-semibold">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
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
            <CardContent className="flex items-center gap-4">
              <UserAvatar
                name={profile.name}
                imageUrl={previewUrl ?? profile.imageUrl}
                className="size-20 text-lg"
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : pendingFile ? "Photo selected" : "Change photo"}
                </Button>
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleAvatarChange}
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
                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={isPending || isUploading}>
                      {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save changes"}
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
