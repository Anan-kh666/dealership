"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, RotateCw, Upload, X } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  useFinancingStore,
  type FinancingDocumentRef,
} from "@/stores/financingStore";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAYSLIPS = 3;
const MAX_BANK_STATEMENTS = 3;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

interface PendingUpload {
  id: string;
  fileName: string;
  status: "uploading" | "error";
  error?: string;
}

async function presign(file: File): Promise<PresignResponse> {
  const res = await fetch(`${API_URL}/public/uploads/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      purpose: "financing",
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

async function uploadToR2(file: File, p: PresignResponse): Promise<void> {
  const res = await fetch(p.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

function newLocalId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StepDocuments({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}): React.ReactElement {
  const icFront = useFinancingStore((s) => s.icFront);
  const icBack = useFinancingStore((s) => s.icBack);
  const payslips = useFinancingStore((s) => s.payslips);
  const bankStatements = useFinancingStore((s) => s.bankStatements);
  const documentsSkipped = useFinancingStore((s) => s.documentsSkipped);
  const storageNotConfigured = useFinancingStore((s) => s.storageNotConfigured);

  const setIcFront = useFinancingStore((s) => s.setIcFront);
  const setIcBack = useFinancingStore((s) => s.setIcBack);
  const addPayslip = useFinancingStore((s) => s.addPayslip);
  const removePayslip = useFinancingStore((s) => s.removePayslip);
  const addBankStatement = useFinancingStore((s) => s.addBankStatement);
  const removeBankStatement = useFinancingStore((s) => s.removeBankStatement);
  const setDocumentsSkipped = useFinancingStore((s) => s.setDocumentsSkipped);
  const setStorageNotConfigured = useFinancingStore(
    (s) => s.setStorageNotConfigured,
  );

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)] md:text-4xl">
        Supporting documents
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-neutral-600)]">
        Upload now to speed up processing, or we&rsquo;ll request these by
        email after submission. JPEG, PNG, or PDF up to 10 MB each.
      </p>

      {storageNotConfigured && !documentsSkipped && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4 text-sm">
          <p className="font-medium text-[var(--color-graphite)]">
            Document upload isn&rsquo;t configured yet.
          </p>
          <p className="mt-1 text-[var(--color-neutral-700)]">
            R2 storage env vars aren&rsquo;t set on this server. Skip this
            step for now — staff will follow up by email.
          </p>
          <button
            type="button"
            onClick={() => setDocumentsSkipped(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-graphite)]/30 px-4 py-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-graphite)]/5"
          >
            Skip for now
          </button>
        </div>
      )}

      {documentsSkipped && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-4 text-sm">
          <p className="font-medium text-[var(--color-graphite)]">
            Documents skipped.
          </p>
          <p className="mt-1 text-[var(--color-neutral-700)]">
            We&rsquo;ll request your IC, payslips, and bank statements by
            email after you submit.
          </p>
          <button
            type="button"
            onClick={() => setDocumentsSkipped(false)}
            className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
          >
            Undo skip
          </button>
        </div>
      )}

      {!documentsSkipped && (
        <div className="mt-8 space-y-8">
          <SingleSlot
            label="IC — front"
            doc={icFront}
            onUploaded={(d) => setIcFront(d)}
            onRemove={() => setIcFront(null)}
            onStorageMissing={() => setStorageNotConfigured(true)}
          />
          <SingleSlot
            label="IC — back"
            doc={icBack}
            onUploaded={(d) => setIcBack(d)}
            onRemove={() => setIcBack(null)}
            onStorageMissing={() => setStorageNotConfigured(true)}
          />
          <MultiSlot
            label="Latest payslips"
            hint={`Up to ${MAX_PAYSLIPS} months. Most recent first.`}
            docs={payslips}
            max={MAX_PAYSLIPS}
            onUploaded={addPayslip}
            onRemove={removePayslip}
            onStorageMissing={() => setStorageNotConfigured(true)}
          />
          <MultiSlot
            label="Bank statements (optional)"
            hint={`Up to ${MAX_BANK_STATEMENTS} months. Most recent first.`}
            docs={bankStatements}
            max={MAX_BANK_STATEMENTS}
            onUploaded={addBankStatement}
            onRemove={removeBankStatement}
            onStorageMissing={() => setStorageNotConfigured(true)}
          />
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-12 flex items-center justify-between border-t border-[var(--color-neutral-200)] bg-[var(--color-surface-warm)] px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BrandButton type="button" variant="ghost-dark" onClick={onBack}>
          Back
        </BrandButton>
        <div className="flex items-center gap-3">
          {!documentsSkipped && (
            <button
              type="button"
              onClick={() => setDocumentsSkipped(true)}
              className="text-sm text-[var(--color-neutral-600)] hover:underline"
            >
              Skip for now
            </button>
          )}
          <BrandButton type="button" size="lg" onClick={onNext}>
            Continue
          </BrandButton>
        </div>
      </div>
    </div>
  );
}

function SingleSlot({
  label,
  doc,
  onUploaded,
  onRemove,
  onStorageMissing,
}: {
  label: string;
  doc: FinancingDocumentRef | null;
  onUploaded: (doc: FinancingDocumentRef) => void;
  onRemove: () => void;
  onStorageMissing: () => void;
}): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);

  const startUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_BYTES) return;
      const id = newLocalId();
      setPending({ id, fileName: file.name, status: "uploading" });
      try {
        const presignRes = await presign(file);
        await uploadToR2(file, presignRes);
        onUploaded({ localId: id, url: presignRes.publicUrl });
        setPending(null);
      } catch (e) {
        if (e instanceof Error && e.name === "StorageNotConfiguredError") {
          setPending(null);
          onStorageMissing();
          return;
        }
        const message = e instanceof Error ? e.message : "Upload failed";
        setPending({ id, fileName: file.name, status: "error", error: message });
      }
    },
    [onUploaded, onStorageMissing],
  );

  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-graphite)]">{label}</p>
      <div className="mt-2">
        {doc ? (
          <UploadedRow
            url={doc.url}
            onRemove={() => {
              onRemove();
              setPending(null);
            }}
          />
        ) : pending ? (
          <PendingRow
            item={pending}
            onRetry={() => {
              setPending(null);
              inputRef.current?.click();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-neutral-300)] bg-white px-4 py-3 text-sm text-[var(--color-neutral-700)] hover:border-[var(--color-accent)]"
          >
            <Upload className="h-4 w-4" aria-hidden /> Upload {label}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void startUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function MultiSlot({
  label,
  hint,
  docs,
  max,
  onUploaded,
  onRemove,
  onStorageMissing,
}: {
  label: string;
  hint: string;
  docs: FinancingDocumentRef[];
  max: number;
  onUploaded: (doc: FinancingDocumentRef) => void;
  onRemove: (id: string) => void;
  onStorageMissing: () => void;
}): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const totalCount =
    docs.length + pending.filter((p) => p.status === "uploading").length;
  const remaining = Math.max(0, max - totalCount);

  const startUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_BYTES) return;
      const id = newLocalId();
      setPending((prev) => [
        ...prev,
        { id, fileName: file.name, status: "uploading" },
      ]);
      try {
        const presignRes = await presign(file);
        await uploadToR2(file, presignRes);
        onUploaded({ localId: id, url: presignRes.publicUrl });
        setPending((prev) => prev.filter((p) => p.id !== id));
      } catch (e) {
        if (e instanceof Error && e.name === "StorageNotConfiguredError") {
          setPending((prev) => prev.filter((p) => p.id !== id));
          onStorageMissing();
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
    [onUploaded, onStorageMissing],
  );

  const handleFiles = (files: FileList | null): void => {
    if (!files) return;
    Array.from(files)
      .slice(0, remaining)
      .forEach((f) => void startUpload(f));
  };

  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-graphite)]">{label}</p>
      <p className="text-xs text-[var(--color-neutral-500)]">{hint}</p>
      <div className="mt-3 space-y-2">
        {docs.map((d) => (
          <UploadedRow
            key={d.localId}
            url={d.url}
            onRemove={() => onRemove(d.localId)}
          />
        ))}
        {pending.map((p) => (
          <PendingRow
            key={p.id}
            item={p}
            onRetry={() => {
              setPending((prev) => prev.filter((x) => x.id !== p.id));
              inputRef.current?.click();
            }}
          />
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-neutral-300)] bg-white px-4 py-3 text-sm text-[var(--color-neutral-700)] hover:border-[var(--color-accent)]"
        >
          <Upload className="h-4 w-4" aria-hidden /> Add file ({totalCount}/
          {max})
        </button>
      )}
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
    </div>
  );
}

function UploadedRow({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}): React.ReactElement {
  const fileName = url.split("/").pop() ?? "file";
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-[var(--color-graphite)]">
        <FileText className="h-4 w-4 text-[var(--color-neutral-500)]" aria-hidden />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="truncate hover:underline"
        >
          {fileName}
        </a>
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center gap-1 text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-graphite)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden /> Remove
      </button>
    </div>
  );
}

function PendingRow({
  item,
  onRetry,
}: {
  item: PendingUpload;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-[var(--color-graphite)]">
        <FileText
          className="h-4 w-4 text-[var(--color-neutral-500)]"
          aria-hidden
        />
        <span className="truncate">{item.fileName}</span>
      </span>
      {item.status === "uploading" ? (
        <span className="inline-flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-neutral-300)] border-t-[var(--color-accent)]" />
          Uploading
        </span>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-error)] hover:underline"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}
