import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@dealership/db";
import { tradeInReferenceFromId } from "@dealership/types";
import { formatDateTime } from "@/lib/dates";
import { requireStaff } from "@/server/session";
import { AdminPageHeader, Card } from "../../ui";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = { title: "Trade-in" };

interface Extras {
  trim?: string | null;
  serviceHistory?: boolean;
  serviceLocation?: string | null;
  accidentHistory?: boolean;
  accidentNote?: string | null;
  modifications?: boolean;
  modificationsNote?: string | null;
  preferredContactMethod?: string;
  bestTimeToCall?: string;
  photosSkipped?: boolean;
}

/** The API stores form extras as JSON in `notes` (see BUILD_NOTES "Trade-in flow"). */
function parseExtras(notes: string | null): Extras {
  if (!notes) return {};
  try {
    const v: unknown = JSON.parse(notes);
    return v && typeof v === "object" ? (v as Extras) : {};
  } catch {
    return {};
  }
}

const yesNo = (v: boolean | undefined, note?: string | null): string =>
  v === undefined ? "—" : v ? `Yes${note ? ` — ${note}` : ""}` : "No";

export default async function AdminTradeInDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requireStaff();
  const { id } = await params;
  const t = await prisma.tradeIn.findUnique({ where: { id } });
  if (!t) notFound();
  const x = parseExtras(t.notes);

  return (
    <>
      <Link
        href="/admin/trade-ins"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-graphite)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All trade-ins
      </Link>
      <AdminPageHeader
        title={`${t.year} ${t.make} ${t.model}${x.trim ? ` ${x.trim}` : ""}`}
        description={`${tradeInReferenceFromId(t.id)} · submitted ${formatDateTime(t.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="border-b border-[var(--color-neutral-200)] px-5 py-4 font-medium">
              Vehicle
            </h2>
            <dl className="divide-y divide-[var(--color-neutral-200)]">
              <Item label="VIN">
                <span className="font-mono">{t.vin ?? "—"}</span>
              </Item>
              <Item label="Mileage">{t.mileage.toLocaleString("en-MY")} km</Item>
              <Item label="Condition">
                <span className="capitalize">{t.condition.toLowerCase()}</span>
              </Item>
              <Item label="Service history">{yesNo(x.serviceHistory, x.serviceLocation)}</Item>
              <Item label="Accidents">{yesNo(x.accidentHistory, x.accidentNote)}</Item>
              <Item label="Modifications">{yesNo(x.modifications, x.modificationsNote)}</Item>
            </dl>
          </Card>

          <Card>
            <h2 className="border-b border-[var(--color-neutral-200)] px-5 py-4 font-medium">
              Photos
            </h2>
            {t.photos.length === 0 ? (
              <p className="px-5 py-4 text-sm text-[var(--color-neutral-600)]">
                {x.photosSkipped
                  ? "Customer skipped uploads (storage unavailable) — request photos directly."
                  : "No photos."}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                {t.photos.map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-neutral-100)]"
                    >
                      {/* Customer uploads live on R2 under arbitrary hosts — plain <img> avoids next/image domain config. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Customer photo ${i + 1}`} className="h-full w-full object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="border-b border-[var(--color-neutral-200)] px-5 py-4 font-medium">
              Quote
            </h2>
            <QuoteForm
              id={t.id}
              status={t.status}
              estimatedValue={t.estimatedValue ? t.estimatedValue.toString() : ""}
            />
          </Card>
          <Card>
            <h2 className="border-b border-[var(--color-neutral-200)] px-5 py-4 font-medium">
              Customer
            </h2>
            <dl className="divide-y divide-[var(--color-neutral-200)]">
              <Item label="Name">{t.contactName}</Item>
              <Item label="Phone">
                <a href={`tel:${t.contactPhone}`} className="underline">
                  {t.contactPhone}
                </a>
              </Item>
              <Item label="Email">
                <a href={`mailto:${t.contactEmail}`} className="underline">
                  {t.contactEmail}
                </a>
              </Item>
              <Item label="Prefers">
                <span className="capitalize">
                  {x.preferredContactMethod?.toLowerCase() ?? "—"}
                  {x.bestTimeToCall ? `, ${x.bestTimeToCall.toLowerCase()}` : ""}
                </span>
              </Item>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 px-5 py-3 text-sm">
      <dt className="text-[var(--color-neutral-500)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
