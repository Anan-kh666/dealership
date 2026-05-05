"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  FINANCING_DOWN_DEFAULT_PCT,
  FINANCING_RATE_DEFAULT,
  FINANCING_TENURE_DEFAULT_YEARS,
  type EmploymentType,
  type FinancingTenureYears,
  type MalaysianState,
  type MaritalStatus,
  type Nationality,
} from "@dealership/types";

export type FinancingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface FinancingDocumentRef {
  /** Local-only id used by the upload UI; not sent to the API. */
  localId: string;
  url: string;
}

interface FinancingState {
  step: FinancingStep;
  hasHydrated: boolean;

  // Step 1 — Vehicle
  stockUnitId: string | null;
  configurationId: string | null;
  vehicleLabel: string | null;
  vehiclePrice: number | null;

  // Step 2 — Loan terms
  downPaymentPercent: number;
  tenureYears: FinancingTenureYears;
  interestRatePercent: number;

  // Step 3 — Personal
  fullName: string;
  icNumber: string;
  dateOfBirth: string;
  nationality: Nationality | null;
  maritalStatus: MaritalStatus | null;
  mobile: string;
  email: string;
  addressStreet: string;
  addressCity: string;
  addressState: MalaysianState | null;
  addressPostcode: string;

  // Step 4 — Employment
  employmentType: EmploymentType | null;
  employerName: string;
  position: string;
  monthlyGrossIncome: number | null;
  monthlyCommitments: number | null;
  yearsEmployed: number | null;

  // Step 5 — Documents (optional)
  icFront: FinancingDocumentRef | null;
  icBack: FinancingDocumentRef | null;
  payslips: FinancingDocumentRef[];
  bankStatements: FinancingDocumentRef[];
  documentsSkipped: boolean;
  storageNotConfigured: boolean;

  // Submission
  submitted: { id: string; reference: string } | null;
}

interface FinancingActions {
  setStep: (s: FinancingStep) => void;
  patch: (p: Partial<FinancingState>) => void;
  setIcFront: (doc: FinancingDocumentRef | null) => void;
  setIcBack: (doc: FinancingDocumentRef | null) => void;
  addPayslip: (doc: FinancingDocumentRef) => void;
  removePayslip: (localId: string) => void;
  addBankStatement: (doc: FinancingDocumentRef) => void;
  removeBankStatement: (localId: string) => void;
  setDocumentsSkipped: (skipped: boolean) => void;
  setStorageNotConfigured: (notConfigured: boolean) => void;
  setSubmitted: (s: { id: string; reference: string }) => void;
  reset: () => void;
  setHydrated: () => void;
}

const initialState: Omit<FinancingState, "hasHydrated"> = {
  step: 1,
  stockUnitId: null,
  configurationId: null,
  vehicleLabel: null,
  vehiclePrice: null,
  downPaymentPercent: FINANCING_DOWN_DEFAULT_PCT,
  tenureYears: FINANCING_TENURE_DEFAULT_YEARS,
  interestRatePercent: FINANCING_RATE_DEFAULT,
  fullName: "",
  icNumber: "",
  dateOfBirth: "",
  nationality: null,
  maritalStatus: null,
  mobile: "",
  email: "",
  addressStreet: "",
  addressCity: "",
  addressState: null,
  addressPostcode: "",
  employmentType: null,
  employerName: "",
  position: "",
  monthlyGrossIncome: null,
  monthlyCommitments: null,
  yearsEmployed: null,
  icFront: null,
  icBack: null,
  payslips: [],
  bankStatements: [],
  documentsSkipped: false,
  storageNotConfigured: false,
  submitted: null,
};

export const useFinancingStore = create<FinancingState & FinancingActions>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setStep: (step) => set({ step }),
      patch: (p) => set(p),
      setIcFront: (icFront) => set({ icFront }),
      setIcBack: (icBack) => set({ icBack }),
      addPayslip: (doc) =>
        set((s) =>
          s.payslips.some((p) => p.localId === doc.localId)
            ? s
            : { payslips: [...s.payslips, doc] },
        ),
      removePayslip: (localId) =>
        set((s) => ({
          payslips: s.payslips.filter((p) => p.localId !== localId),
        })),
      addBankStatement: (doc) =>
        set((s) =>
          s.bankStatements.some((p) => p.localId === doc.localId)
            ? s
            : { bankStatements: [...s.bankStatements, doc] },
        ),
      removeBankStatement: (localId) =>
        set((s) => ({
          bankStatements: s.bankStatements.filter(
            (p) => p.localId !== localId,
          ),
        })),
      setDocumentsSkipped: (documentsSkipped) => set({ documentsSkipped }),
      setStorageNotConfigured: (storageNotConfigured) =>
        set({ storageNotConfigured }),
      setSubmitted: (submitted) => set({ submitted }),
      reset: () => set({ ...initialState }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "financing-flow",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : window.sessionStorage,
      ),
      partialize: (s) => ({
        step: s.step,
        stockUnitId: s.stockUnitId,
        configurationId: s.configurationId,
        vehicleLabel: s.vehicleLabel,
        vehiclePrice: s.vehiclePrice,
        downPaymentPercent: s.downPaymentPercent,
        tenureYears: s.tenureYears,
        interestRatePercent: s.interestRatePercent,
        fullName: s.fullName,
        icNumber: s.icNumber,
        dateOfBirth: s.dateOfBirth,
        nationality: s.nationality,
        maritalStatus: s.maritalStatus,
        mobile: s.mobile,
        email: s.email,
        addressStreet: s.addressStreet,
        addressCity: s.addressCity,
        addressState: s.addressState,
        addressPostcode: s.addressPostcode,
        employmentType: s.employmentType,
        employerName: s.employerName,
        position: s.position,
        monthlyGrossIncome: s.monthlyGrossIncome,
        monthlyCommitments: s.monthlyCommitments,
        yearsEmployed: s.yearsEmployed,
        icFront: s.icFront,
        icBack: s.icBack,
        payslips: s.payslips,
        bankStatements: s.bankStatements,
        documentsSkipped: s.documentsSkipped,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
