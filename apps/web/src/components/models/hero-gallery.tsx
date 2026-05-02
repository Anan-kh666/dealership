"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@dealership/ui/lib/cn";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  type: "EXTERIOR" | "INTERIOR" | "DETAIL" | "LIFESTYLE";
};

const TAB_ORDER: GalleryImage["type"][] = ["EXTERIOR", "INTERIOR", "DETAIL", "LIFESTYLE"];
const TAB_LABEL: Record<GalleryImage["type"], string> = {
  EXTERIOR: "Exterior",
  INTERIOR: "Interior",
  DETAIL: "Details",
  LIFESTYLE: "Lifestyle",
};

interface HeroGalleryProps {
  images: GalleryImage[];
  modelName: string;
}

export function HeroGallery({ images, modelName }: HeroGalleryProps): React.ReactElement {
  const tabsAvailable = useMemo(
    () => TAB_ORDER.filter((t) => images.some((i) => i.type === t)),
    [images],
  );
  const initialTab = tabsAvailable[0] ?? "EXTERIOR";
  const [tab, setTab] = useState<GalleryImage["type"]>(initialTab);
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = images.filter((i) => i.type === tab);
  const active = filtered[activeIdx] ?? filtered[0];

  const onTabChange = (t: GalleryImage["type"]): void => {
    setTab(t);
    setActiveIdx(0);
  };

  if (!active) return <div className="aspect-[16/9] w-full bg-[var(--color-neutral-100)]" />;

  return (
    <div className="flex flex-col gap-4">
      {tabsAvailable.length > 1 ? (
        <div
          role="tablist"
          aria-label={`${modelName} gallery views`}
          className="flex gap-2 overflow-x-auto px-4 md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabsAvailable.map((t) => {
            const isActive = t === tab;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(t)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                  isActive
                    ? "border-[var(--color-graphite)] bg-[var(--color-graphite)] text-white"
                    : "border-[var(--color-neutral-200)] bg-white text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-300)]",
                )}
              >
                {TAB_LABEL[t]}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-neutral-100)] md:aspect-[21/9]">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Mobile: dot indicators */}
      {filtered.length > 1 ? (
        <div className="flex justify-center gap-2 md:hidden">
          {filtered.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i === activeIdx
                  ? "bg-[var(--color-graphite)]"
                  : "bg-[var(--color-neutral-300)]",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Desktop: thumbnail strip */}
      {filtered.length > 1 ? (
        <div className="hidden gap-3 px-4 md:flex md:px-12">
          {filtered.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Show ${img.alt}`}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                i === activeIdx
                  ? "border-[var(--color-accent)]"
                  : "border-transparent hover:border-[var(--color-neutral-300)]",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
