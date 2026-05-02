"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@dealership/ui/components/dialog";

export type GridImage = {
  id: string;
  url: string;
  alt: string;
};

interface ImageGalleryProps {
  images: GridImage[];
}

export function ImageGallery({ images }: ImageGalleryProps): React.ReactElement | null {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  const active = openIdx !== null ? images[openIdx] : null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[var(--duration-reveal)] hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{active?.alt ?? "Image"}</DialogTitle>
          {active ? (
            <div className="flex flex-col gap-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-md)] bg-black">
                <Image
                  src={active.url}
                  alt={active.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              <p className="text-center text-sm text-white/80">{active.alt}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
