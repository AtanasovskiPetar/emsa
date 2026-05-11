import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { PositionsSection } from "@/components/admin/PositionsSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiRoutes } from "@/constants/routes";
import { type UpdateOrganizationPayload } from "@/constants/schemas";
import { type ImageEntry, type Organization } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { getImageSrc, uploadImageToS3 } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  state: ImageEntry;
  onChange: (state: ImageEntry) => void;
}

function ImageUpload({ label, state, onChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const src = getImageSrc(state);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (state.type === "new") URL.revokeObjectURL(state.previewUrl);
    onChange({ type: "new", file, previewUrl: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function handleRemove() {
    if (state.type === "new") URL.revokeObjectURL(state.previewUrl);
    onChange({ type: "none" });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {src ? (
        <div className="group relative w-fit">
          <img src={src} alt={label} className="h-32 rounded-md border object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-32 w-48 cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
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
  );
}

type FormValues = {
  name: string;
  description: string;
  aboutUs: string;
  instagramUrl: string;
  facebookUrl: string;
  location: string;
  email: string;
  phone: string;
};

export function OrganizationPage() {
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<ImageEntry>({ type: "none" });

  const { data: org, isLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: () => apiClient.get<Organization | null>(ApiRoutes.ADMIN_ORGANIZATION),
  });

  const { register, setValue, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      aboutUs: "",
      instagramUrl: "",
      facebookUrl: "",
      location: "",
      email: "",
      phone: "",
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (!org) return;
    setValue("name", org.name);
    setValue("description", org.description);
    setValue("aboutUs", org.aboutUs);
    setValue("instagramUrl", org.instagramUrl ?? "");
    setValue("facebookUrl", org.facebookUrl ?? "");
    setValue("location", org.location ?? "");
    setValue("email", org.email ?? "");
    setValue("phone", org.phone ?? "");
    setLogo(org.logoUrl ? { type: "existing", url: org.logoUrl } : { type: "none" });
  }, [org, setValue]);

  const { mutateAsync: uploadLogo, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadImageToS3(file, ApiRoutes.ADMIN_ORGANIZATION_UPLOAD),
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      apiClient.patch<Organization>(ApiRoutes.ADMIN_ORGANIZATION, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organization"] });
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const logoUrl =
        logo.type === "new"
          ? await uploadLogo(logo.file)
          : logo.type === "existing"
            ? logo.url
            : null;

      save({
        name: values.name,
        description: values.description,
        aboutUs: values.aboutUs,
        logoUrl,
        instagramUrl: values.instagramUrl.trim() || null,
        facebookUrl: values.facebookUrl.trim() || null,
        location: values.location.trim() || null,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
      });
    } catch {
      // upload failed, don't proceed
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const isSubmitting = isUploading || isPending;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold">Organization</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization&apos;s public information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input id="name" placeholder="Organization name" {...register("name")} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-medium">Contact</h3>
            <p className="text-sm text-muted-foreground">
              Shown in the contact section of the public site.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Skopje, North Macedonia"
              {...register("location")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@yourorg.com"
              {...register("email")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" placeholder="+389 2 123 456" {...register("phone")} />
          </div>
        </div>

        <ImageUpload label="Logo" state={logo} onChange={setLogo} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="A short description shown in the hero section of the public site"
            rows={3}
            {...register("description")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>About Us</Label>
          <RichTextEditor value={watch("aboutUs")} onChange={(v) => setValue("aboutUs", v)} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-medium">Socials</h3>
            <p className="text-sm text-muted-foreground">Links shown in the public footer.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              placeholder="https://instagram.com/yourorg"
              {...register("instagramUrl")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              placeholder="https://facebook.com/yourorg"
              {...register("facebookUrl")}
            />
          </div>
        </div>

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <PositionsSection />
    </div>
  );
}
