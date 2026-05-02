"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@dealership/ui/lib/cn";

export type StockGalleryImage = { id: string; url: string; alt: string };

export function StockGallery({
  images,
}: {
  images: StockGalleryImage[];
}): React.ReactElement {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="aspect-[16/9] w-full bg-[var(--color-neutral-100)]" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-neutral-100)] md:aspect-[21/9]">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Mobile dots */}
      {images.length > 1 ? (
        <div className="flex justify-center gap-2 md:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i === active
                  ? "bg-[var(--color-graphite)]"
                  : "bg-[var(--color-neutral-300)]",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Desktop thumbs */}
      {images.length > 1 ? (
        <div className="hidden gap-3 px-4 md:flex md:flex-wrap md:px-12">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${img.alt}`}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                i === active
                  ? "border-[var(--color-accent)]"
                  : "border-transparent hover:border-[var(--color-neutral-300)]",
              )}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
