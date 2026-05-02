"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { HERO_IMAGE } from "@/data/placeholders";

const STAGGER = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero(): React.ReactElement {
  const reduce = useReducedMotion();
  return (
    <section className="relative isolate flex min-h-[100vh] w-full items-end overflow-hidden md:min-h-[88vh]">
      <Image
        src={HERO_IMAGE}
        alt="Dark luxury sedan parked on a quiet road at dusk"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-32 md:px-6 md:pb-32 lg:px-12">
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={STAGGER}
          className="flex max-w-3xl flex-col gap-6 text-white"
        >
          <motion.p
            variants={ITEM}
            className="text-xs uppercase tracking-[0.24em] text-white/80"
          >
            New 2026 lineup
          </motion.p>
          <motion.h1
            variants={ITEM}
            className="font-[family-name:var(--font-display)] font-light leading-[1] tracking-[-0.02em]"
            style={{ fontSize: "clamp(48px, 8vw, 96px)" }}
          >
            Engineered for
            <br />
            the long road.
          </motion.h1>
          <motion.p
            variants={ITEM}
            className="max-w-[540px] text-lg text-white/85 md:text-xl"
          >
            Authorised new-car ownership for Malaysian drivers — chosen with care, serviced
            on schedule, and built to outlast the Klang Valley monsoon.
          </motion.p>
          <motion.div variants={ITEM} className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-4">
            <BrandButton asChild variant="primary" size="lg">
              <Link href="/models">Build Yours</Link>
            </BrandButton>
            <BrandButton asChild variant="hero-only" size="lg">
              <Link href="/stock">Available Now</Link>
            </BrandButton>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute inset-x-0 bottom-6 flex justify-center"
      >
        <div className="flex flex-col items-center gap-2 text-white/70">
          <span className="text-[10px] uppercase tracking-[0.24em]">Scroll</span>
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>
      </motion.div>
    </section>
  );
}
