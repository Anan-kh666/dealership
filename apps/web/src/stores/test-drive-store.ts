"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SelectedVehicle =
  | { kind: "model"; modelId: string; label: string; trimLabel?: string }
  | {
      kind: "stockUnit";
      stockUnitId: string;
      modelId: string;
      label: string;
      trimLabel?: string;
    };

export interface DetailsForm {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  drivingLicense: string;
  notes: string;
  createAccount: boolean;
  password: string;
}

const EMPTY_DETAILS: DetailsForm = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  drivingLicense: "",
  notes: "",
  createAccount: false,
  password: "",
};

export type StepIndex = 1 | 2 | 3 | 4 | 5;

interface TestDriveState {
  step: StepIndex;
  vehicle: SelectedVehicle | null;
  /** ISO string of the chosen UTC instant. */
  scheduledAtIso: string | null;
  details: DetailsForm;
  consent: boolean;
  hasHydrated: boolean;
  setStep: (s: StepIndex) => void;
  selectVehicle: (v: SelectedVehicle) => void;
  clearVehicle: () => void;
  setSlot: (iso: string | null) => void;
  setDetails: (d: Partial<DetailsForm>) => void;
  setConsent: (c: boolean) => void;
  reset: () => void;
  setHydrated: () => void;
}

export const useTestDriveStore = create<TestDriveState>()(
  persist(
    (set) => ({
      step: 1,
      vehicle: null,
      scheduledAtIso: null,
      details: EMPTY_DETAILS,
      consent: false,
      hasHydrated: false,
      setStep: (step) => set({ step }),
      selectVehicle: (vehicle) => set({ vehicle }),
      clearVehicle: () => set({ vehicle: null, step: 1 }),
      setSlot: (scheduledAtIso) => set({ scheduledAtIso }),
      setDetails: (d) =>
        set((s) => ({ details: { ...s.details, ...d } })),
      setConsent: (consent) => set({ consent }),
      reset: () =>
        set({
          step: 1,
          vehicle: null,
          scheduledAtIso: null,
          details: EMPTY_DETAILS,
          consent: false,
        }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "test-drive-flow",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : window.sessionStorage,
      ),
      partialize: (s) => ({
        step: s.step,
        vehicle: s.vehicle,
        scheduledAtIso: s.scheduledAtIso,
        details: s.details,
        consent: s.consent,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
