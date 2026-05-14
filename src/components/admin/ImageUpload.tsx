import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { UserAvatar } from "@/components/UserAvatar";
import { type ImageEntry } from "@/constants/types";
import { cn, getImageSrc } from "@/lib/utils";

interface ImageUploadProps {
  state: ImageEntry;
  onChange: (state: ImageEntry) => void;
  variant?: "square" | "avatar";
  name?: string;
  maxSizeBytes?: number;
}

export function ImageUpload({
  state,
  onChange,
  variant = "square",
  name = "",
  maxSizeBytes,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const src = getImageSrc(state);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (maxSizeBytes && file.size > maxSizeBytes) {
      setSizeError(`File size must be ${Math.round(maxSizeBytes / 1024 / 1024)} MB or less.`);
      e.target.value = "";
      return;
    }
    setSizeError(null);
    if (state.type === "new") URL.revokeObjectURL(state.previewUrl);
    onChange({ type: "new", file, previewUrl: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function handleRemove() {
    if (state.type === "new") URL.revokeObjectURL(state.previewUrl);
    onChange({ type: "none" });
  }

  return (
    <div className="flex flex-col gap-1">
      {src ? (
        <div className="group relative w-fit">
          {variant === "avatar" ? (
            <UserAvatar name={name} imageUrl={src} className="size-20 text-lg" />
          ) : (
            <img src={src} alt="" className="h-32 rounded-md border object-cover" />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-1 top-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer items-center justify-center border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
            variant === "avatar" ? "size-20 rounded-lg" : "h-32 w-48 rounded-md"
          )}
        >
          <ImagePlus className="size-5" />
        </div>
      )}
      {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}
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
