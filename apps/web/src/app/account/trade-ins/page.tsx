import type { Metadata } from "next";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { TRADE_IN_STATUS } from "@/lib/status";
import { getTradeIns } from "@/server/account-data";
import { requireUser } from "@/server/session";
import { EmptyState, List, Panel, Row } from "../ui";

export const metadata: Metadata = { title: "Trade-ins" };

export default async function AccountTradeInsPage(): Promise<React.ReactElement> {
  const user = await requireUser("/account/trade-ins");
  const items = await getTradeIns(user);

  return (
    <Panel
      title="Trade-in valuations"
      description="Quotes are valid for 7 days and subject to a physical inspection."
    >
      {items.length === 0 ? (
        <EmptyState
          title="No trade-ins yet"
          body="Tell us about your current car and we'll send a valuation within one business day."
          cta={{ href: "/trade-in", label: "Value my car" }}
        />
      ) : (
        <List>
          {items.map((t) => {
            const meta = TRADE_IN_STATUS[t.status];
            return (
              <Row key={t.id}>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{t.vehicleLabel}</p>
                  <p className="text-sm text-[var(--color-neutral-700)]">
                    {t.mileage.toLocaleString("en-MY")} km
                  </p>
                  <p className="text-xs text-[var(--color-neutral-500)]">
                    <span className="font-mono">{t.reference}</span> · submitted{" "}
                    {formatDate(t.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{meta.description}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  {t.estimatedValue !== null ? (
                    <p className="font-[family-name:var(--font-display)] text-xl tabular-nums tracking-[-0.02em]">
                      {formatPrice(t.estimatedValue)}
                    </p>
                  ) : null}
                </div>
              </Row>
            );
          })}
        </List>
      )}
    </Panel>
  );
}
