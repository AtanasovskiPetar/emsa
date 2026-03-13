import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ApiRoutes } from "@/constants/routes";
import { updateMeSchema, type UpdateMePayload } from "@/constants/schemas";
import { type UserProfile } from "@/constants/types";
import { useAuth } from "@/context/auth";
import { apiClient } from "@/lib/api-client";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<UserProfile>(ApiRoutes.USERS_ME),
  });

  const { mutate: updateMe, isPending } = useMutation({
    mutationFn: (payload: UpdateMePayload) =>
      apiClient.patch<UserProfile>(ApiRoutes.USERS_ME, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
    },
  });

  const form = useForm<UpdateMePayload>({
    resolver: zodResolver(updateMeSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone ?? undefined, imageUrl: profile.imageUrl ?? undefined }
      : undefined,
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(values: UpdateMePayload) {
    let imageUrl = values.imageUrl;

    if (pendingFile) {
      setIsUploading(true);
      try {
        const { uploadUrl, fileUrl } = await apiClient.get<{ uploadUrl: string; fileUrl: string }>(
          `${ApiRoutes.UPLOAD_PRESIGNED}?contentType=${encodeURIComponent(pendingFile.type)}`
        );
        await fetch(uploadUrl, {
          method: "PUT",
          body: pendingFile,
          headers: { "Content-Type": pendingFile.type },
        });
        imageUrl = fileUrl;
      } finally {
        setIsUploading(false);
      }
    }

    updateMe(
      { ...values, imageUrl },
      {
        onSuccess: (updated) => {
          setPendingFile(null);
          setPreviewUrl(null);
          const finalImageUrl =
            pendingFile && imageUrl ? `${imageUrl}?t=${Date.now()}` : updated.imageUrl;
          queryClient.setQueryData(["me"], { ...updated, imageUrl: finalImageUrl });
          updateUser({ name: updated.name, imageUrl: finalImageUrl });
        },
      }
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Click to upload a new profile picture</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={previewUrl ?? profile.imageUrl ?? undefined} alt={profile.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
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
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update your name and phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
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
