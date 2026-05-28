import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/admin/ImageUpload";
import { PositionsSection } from "@/components/admin/PositionsSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type ImageEntry, type Organization } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { resolveImageEntry } from "@/lib/utils";

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
    queryKey: queryKeys.admin.organization(),
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

  const { mutate: save, isPending } = useMutation({
    mutationFn: async ({ logo: imageEntry, ...values }: FormValues & { logo: ImageEntry }) => {
      const logoUrl = await resolveImageEntry(imageEntry, ApiRoutes.ADMIN_ORGANIZATION_UPLOAD);
      return apiClient.patch<Organization>(ApiRoutes.ADMIN_ORGANIZATION, {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.organization() });
    },
  });

  function onSubmit(values: FormValues) {
    save({ ...values, logo });
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

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

        <div className="flex flex-col gap-2">
          <Label>Logo</Label>
          <ImageUpload state={logo} onChange={setLogo} />
        </div>

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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <PositionsSection />
    </div>
  );
}
