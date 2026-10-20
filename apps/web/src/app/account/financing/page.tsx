import type { Metadata } from "next";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { APP_STATUS } from "@/lib/status";
import { getApplications } from "@/server/account-data";
import { requireUser } from "@/server/session";
import { EmptyState, List, Panel, Row } from "../ui";

export const metadata: Metadata = { title: "Financing" };

export default async function AccountFinancingPage(): Promise<React.ReactElement> {
  const user = await requireUser("/account/financing");
  const apps = await getApplications(user);

  return (
    <Panel
      title="Financing applications"
      description="We share updates from the banks here as soon as we receive them."
    >
      {apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Estimate your monthly payment first, then apply online in about ten minutes."
          cta={{ href: "/financing", label: "Open the calculator" }}
        />
      ) : (
        <List>
          {apps.map((a) => {
            const meta = APP_STATUS[a.status];
            return (
              <Row key={a.id}>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{a.vehicleLabel}</p>
                  <p className="text-sm text-[var(--color-neutral-700)]">
                    {formatPrice(a.vehiclePrice)} · est. {formatPrice(Math.round(a.estimatedMonthly))}
                    /mo over {a.tenureYears} years
                  </p>
                  <p className="text-xs text-[var(--color-neutral-500)]">
                    <span className="font-mono">{a.reference}</span> · submitted{" "}
                    {formatDate(a.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{meta.description}</p>
                </div>
                <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
              </Row>
            );
          })}
        </List>
      )}
    </Panel>
  );
}
