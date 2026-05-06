"use client";

import { create } from "zustand";

/**
 * URL-driven configurator state. The page itself is the source of truth via
 * search params; this store is a convenience layer so step components can
 * read/write per-property values without prop drilling. State is *not*
 * persisted — refreshing the page reads from the URL again.
 *
 * CRITICAL: read with per-property primitive selectors, e.g.
 *   const trimId = useConfiguratorStore((s) => s.trimId);
 * NEVER `const s = useConfiguratorStore()` and NEVER object-returning
 * selectors. The trade-in flow had infinite-loop bugs from those — don't
 * repeat them here.
 */

interface ConfiguratorState {
  trimId: string | null;
  exteriorColorId: string | null;
  interiorColorId: string | null;
  optionIds: string[];
  /** Flat step index, 1-based. Final step is the summary. */
  step: number;
  /** True once the client has read the URL once. Used to avoid SSR mismatch. */
  hasHydrated: boolean;

  setTrim: (id: string | null) => void;
  setExterior: (id: string | null) => void;
  setInterior: (id: string | null) => void;
  setOptions: (ids: string[]) => void;
  toggleOption: (id: string) => void;
  setStep: (n: number) => void;
  hydrate: (init: {
    trimId: string | null;
    exteriorColorId: string | null;
    interiorColorId: string | null;
    optionIds: string[];
  }) => void;
  setHydrated: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  trimId: null,
  exteriorColorId: null,
  interiorColorId: null,
  optionIds: [],
  step: 1,
  hasHydrated: false,

  setTrim: (trimId) => set({ trimId }),
  setExterior: (exteriorColorId) => set({ exteriorColorId }),
  setInterior: (interiorColorId) => set({ interiorColorId }),
  setOptions: (optionIds) => set({ optionIds }),
  toggleOption: (id) =>
    set((s) => ({
      optionIds: s.optionIds.includes(id)
        ? s.optionIds.filter((x) => x !== id)
        : [...s.optionIds, id],
    })),
  setStep: (step) => set({ step }),
  hydrate: ({ trimId, exteriorColorId, interiorColorId, optionIds }) =>
    set({
      trimId,
      exteriorColorId,
      interiorColorId,
      optionIds,
      hasHydrated: true,
    }),
  setHydrated: () => set({ hasHydrated: true }),
}));
