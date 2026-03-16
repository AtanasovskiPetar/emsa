import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
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

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { logout, updateUser, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
      apiClient.patch<UserProfile>(ApiRoutes.USERS_ME, payload),
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
      onSuccess: (updated) => {
        setPendingFile(null);
        setPreviewUrl(null);
        queryClient.setQueryData(["me"], updated);
        updateUser({
          name: updated.name,
          imageUrl: updated.imageUrl,
          profileCompleted: updated.profileCompleted,
        });
      },
    });
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>

      {!user?.profileCompleted && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Please complete your profile to access the platform.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Click to upload a new profile picture</CardDescription>
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
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update your name and contact details</CardDescription>
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="+1 234 567 8900" />
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
                    <FormLabel>Student index</FormLabel>
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
                    <FormLabel>Year of studies</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || isUploading}>
                  {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
