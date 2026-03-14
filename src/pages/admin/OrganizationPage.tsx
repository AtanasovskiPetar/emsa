import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  aboutUs: string;
};

export function OrganizationPage() {
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<ImageEntry>({ type: "none" });
  const [isUploading, setIsUploading] = useState(false);

  const { data: org, isLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: () => apiClient.get<Organization | null>(ApiRoutes.ADMIN_ORGANIZATION),
  });

  const { register, setValue, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", aboutUs: "" },
  });

  // Populate form when data loads
  useEffect(() => {
    if (!org) return;
    setValue("name", org.name);
    setValue("aboutUs", org.aboutUs);
    setLogo(org.logoUrl ? { type: "existing", url: org.logoUrl } : { type: "none" });
  }, [org, setValue]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      apiClient.patch<Organization>(ApiRoutes.ADMIN_ORGANIZATION, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organization"] });
    },
  });

  async function onSubmit(values: FormValues) {
    setIsUploading(true);
    try {
      const logoUrl =
        logo.type === "new"
          ? await uploadImageToS3(logo.file, ApiRoutes.ADMIN_ORGANIZATION_UPLOAD)
          : logo.type === "existing"
            ? logo.url
            : null;

      save({ name: values.name, aboutUs: values.aboutUs, logoUrl });
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const isSubmitting = isUploading || isPending;

  return (
    <div className="flex flex-col gap-6">
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

        <ImageUpload label="Logo" state={logo} onChange={setLogo} />

        <div className="flex flex-col gap-2">
          <Label>About Us</Label>
          <RichTextEditor value={watch("aboutUs")} onChange={(v) => setValue("aboutUs", v)} />
        </div>

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
