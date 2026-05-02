"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, RotateCw, Upload, X } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { useTradeInStore, type UploadedPhoto } from "@/stores/tradeInStore";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;
const MIN_PHOTOS = 4;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "error";
  error?: string;
}

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

async function presign(file: File): Promise<PresignResponse> {
  const res = await fetch(`${API_URL}/public/uploads/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      purpose: "trade-in",
      contentType: file.type,
      fileSize: file.size,
    }),
  });
  if (res.status === 503) {
    const err = new Error("storage_not_configured");
    err.name = "StorageNotConfiguredError";
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Presign failed: ${res.status}`);
  }
  return res.json() as Promise<PresignResponse>;
}

async function uploadToR2(file: File, presignRes: PresignResponse): Promise<void> {
  const res = await fetch(presignRes.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

export function StepPhotos({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const photos = useTradeInStore((s) => s.photos);
  const photosSkipped = useTradeInStore((s) => s.photosSkipped);
  const addPhoto = useTradeInStore((s) => s.addPhoto);
  const removePhotoFromStore = useTradeInStore((s) => s.removePhoto);
  const setPhotosSkipped = useTradeInStore((s) => s.setPhotosSkipped);

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [storageNotConfigured, setStorageNotConfigured] = useState(false);

  const totalCount = photos.length + pending.filter((p) => p.status === "uploading").length;
  const canContinue = photosSkipped || photos.length >= MIN_PHOTOS;

  const startUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return;
      }
      if (file.size > MAX_BYTES) {
        return;
      }
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      setPending((prev) => [
        ...prev,
        { id, file, previewUrl, status: "uploading" },
      ]);
      try {
        const presignRes = await presign(file);
        await uploadToR2(file, presignRes);
        addPhoto({ id, publicUrl: presignRes.publicUrl });
        setPending((prev) => prev.filter((p) => p.id !== id));
        URL.revokeObjectURL(previewUrl);
      } catch (e) {
        if (e instanceof Error && e.name === "StorageNotConfiguredError") {
          setStorageNotConfigured(true);
          setPending((prev) => prev.filter((p) => p.id !== id));
          URL.revokeObjectURL(previewUrl);
          return;
        }
        const message = e instanceof Error ? e.message : "Upload failed";
        setPending((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "error", error: message } : p,
          ),
        );
      }
    },
    [addPhoto],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_PHOTOS - totalCount;
      const arr = Array.from(files).slice(0, Math.max(0, remaining));
      arr.forEach((f) => void startUpload(f));
    },
    [startUpload, totalCount],
  );

  const retry = (item: PendingUpload): void => {
    setPending((prev) => prev.filter((p) => p.id !== item.id));
    URL.revokeObjectURL(item.previewUrl);
    void startUpload(item.file);
  };

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Show us how it looks
      </h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--color-neutral-600)]">
        Upload at least {MIN_PHOTOS} photos (up to {MAX_PHOTOS}). Ideal angles:
        front, rear, both sides, dashboard, odometer, and any damage.
      </p>

      {storageNotConfigured && !photosSkipped && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4 text-sm">
          <p className="font-medium text-[var(--color-graphite)]">
            Photo upload isn&rsquo;t configured yet.
          </p>
          <p className="mt-1 text-[var(--color-neutral-700)]">
            R2 storage env vars aren&rsquo;t set on this server. You can skip
            photos for now — your trade-in will be flagged for staff to follow
            up about photos directly.
          </p>
          <button
            type="button"
            onClick={() => setPhotosSkipped(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-graphite)]/30 px-4 py-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-graphite)]/5"
          >
            Skip for now
          </button>
        </div>
      )}

      {photosSkipped && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-4 text-sm">
          <p className="font-medium text-[var(--color-graphite)]">
            Photos skipped.
          </p>
          <p className="mt-1 text-[var(--color-neutral-700)]">
            Staff will follow up to collect photos directly.
          </p>
          <button
            type="button"
            onClick={() => setPhotosSkipped(false)}
            className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
          >
            Undo
          </button>
        </div>
      )}

      {!photosSkipped && (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Add photos"
            className="mt-6 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-neutral-300)] bg-white px-6 py-12 text-center transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <Upload className="h-8 w-8 text-[var(--color-neutral-400)]" aria-hidden />
            <p className="text-sm text-[var(--color-neutral-700)]">
              Drag photos here, or
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <BrandButton
                type="button"
                size="sm"
                variant="ghost-dark"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden />
                Add photos
              </BrandButton>
              <BrandButton
                type="button"
                size="sm"
                variant="ghost-dark"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" aria-hidden />
                Use camera
              </BrandButton>
            </div>
            <p className="text-xs text-[var(--color-neutral-500)]">
              JPEG, PNG, WebP, or HEIC. Max 10 MB each.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {(photos.length > 0 || pending.length > 0) && (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => (
                <PhotoTile
                  key={p.id}
                  photo={p}
                  onRemove={() => removePhotoFromStore(p.id)}
                />
              ))}
              {pending.map((p) => (
                <PendingTile key={p.id} item={p} onRetry={() => retry(p)} />
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm text-[var(--color-neutral-600)]">
            {photos.length} of {MIN_PHOTOS} required uploaded
            {photos.length >= MIN_PHOTOS && ` · maximum ${MAX_PHOTOS}`}
          </p>
        </>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!canContinue} />
    </div>
  );
}

function PhotoTile({
  photo,
  onRemove,
}: {
  photo: UploadedPhoto;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <li className="group relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white">
      <div className="aspect-square w-full bg-[var(--color-neutral-100)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.publicUrl}
          alt="Uploaded photo"
          className="h-full w-full object-cover"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--color-graphite)] shadow-[var(--shadow-1)] transition-opacity hover:bg-white"
        aria-label="Remove photo"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

function PendingTile({
  item,
  onRetry,
}: {
  item: PendingUpload;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <li className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white">
      <div className="aspect-square w-full bg-[var(--color-neutral-100)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt="Uploading"
          className="h-full w-full object-cover opacity-60"
        />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
        {item.status === "uploading" ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span className="text-xs uppercase tracking-wider">Uploading</span>
          </>
        ) : (
          <>
            <span className="text-xs">Failed</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-[var(--color-graphite)]"
            >
              <RotateCw className="h-3 w-3" aria-hidden />
              Retry
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}): React.ReactElement {
  return (
    <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
      <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
        Back
      </BrandButton>
      <BrandButton type="button" disabled={nextDisabled} onClick={onNext} size="lg">
        Continue
      </BrandButton>
    </div>
  );
}
