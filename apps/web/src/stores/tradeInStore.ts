"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TradeInStep = 1 | 2 | 3 | 4 | 5;
export type TradeInCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type TradeInContactMethod = "PHONE" | "EMAIL" | "WHATSAPP";
export type TradeInBestTime = "MORNING" | "AFTERNOON" | "EVENING" | "ANYTIME";

export interface UploadedPhoto {
  id: string;
  publicUrl: string;
}

interface TradeInState {
  step: TradeInStep;
  configurationId: string | null;

  // Step 1
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;

  // Step 2
  mileage: number | null;
  condition: TradeInCondition | null;
  serviceHistory: boolean | null;
  serviceLocation: string | null;
  accidentHistory: boolean | null;
  accidentNote: string | null;
  modifications: boolean | null;
  modificationsNote: string | null;

  // Step 3
  photos: UploadedPhoto[];
  photosSkipped: boolean;

  // Step 4
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  preferredContactMethod: TradeInContactMethod | null;
  bestTimeToCall: TradeInBestTime | null;

  // Submission
  submitted: { id: string; reference: string } | null;

  // Hydration flag — set by `onRehydrateStorage` so consumers can avoid
  // SSR/CSR mismatch when reading sessionStorage-backed state.
  hasHydrated: boolean;
}

interface TradeInActions {
  setStep: (s: TradeInStep) => void;
  setConfigurationId: (id: string | null) => void;
  patch: (p: Partial<TradeInState>) => void;
  addPhoto: (photo: UploadedPhoto) => void;
  removePhoto: (id: string) => void;
  reorderPhotos: (ids: string[]) => void;
  setPhotosSkipped: (skipped: boolean) => void;
  setSubmitted: (s: { id: string; reference: string }) => void;
  reset: () => void;
  setHydrated: () => void;
}

const initialState: Omit<TradeInState, "hasHydrated"> = {
  step: 1,
  configurationId: null,
  vin: null,
  make: null,
  model: null,
  year: null,
  trim: null,
  mileage: null,
  condition: null,
  serviceHistory: null,
  serviceLocation: null,
  accidentHistory: null,
  accidentNote: null,
  modifications: null,
  modificationsNote: null,
  photos: [],
  photosSkipped: false,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  preferredContactMethod: null,
  bestTimeToCall: null,
  submitted: null,
};

export const useTradeInStore = create<TradeInState & TradeInActions>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setStep: (step) => set({ step }),
      setConfigurationId: (configurationId) => set({ configurationId }),
      patch: (p) => set(p),
      addPhoto: (photo) =>
        set((s) => ({
          photos: s.photos.some((p) => p.id === photo.id)
            ? s.photos
            : [...s.photos, photo],
        })),
      removePhoto: (id) =>
        set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
      reorderPhotos: (ids) =>
        set((s) => {
          const map = new Map(s.photos.map((p) => [p.id, p]));
          const ordered = ids
            .map((id) => map.get(id))
            .filter((p): p is UploadedPhoto => Boolean(p));
          return { photos: ordered };
        }),
      setPhotosSkipped: (photosSkipped) => set({ photosSkipped }),
      setSubmitted: (submitted) => set({ submitted }),
      reset: () => set({ ...initialState }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "trade-in-flow",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : window.sessionStorage,
      ),
      partialize: (s) => ({
        step: s.step,
        configurationId: s.configurationId,
        vin: s.vin,
        make: s.make,
        model: s.model,
        year: s.year,
        trim: s.trim,
        mileage: s.mileage,
        condition: s.condition,
        serviceHistory: s.serviceHistory,
        serviceLocation: s.serviceLocation,
        accidentHistory: s.accidentHistory,
        accidentNote: s.accidentNote,
        modifications: s.modifications,
        modificationsNote: s.modificationsNote,
        photos: s.photos,
        photosSkipped: s.photosSkipped,
        contactName: s.contactName,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        preferredContactMethod: s.preferredContactMethod,
        bestTimeToCall: s.bestTimeToCall,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
