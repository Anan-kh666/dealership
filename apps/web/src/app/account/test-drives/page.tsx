import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@dealership/types";
import { StatusPill } from "@/components/status-pill";
import { formatDateLong, formatTime } from "@/lib/dates";
import { TEST_DRIVE_STATUS } from "@/lib/status";
import { getTestDrives } from "@/server/account-data";
import { requireUser } from "@/server/session";
import { cancelTestDriveAction } from "../actions";
import { EmptyState, List, Panel, Row } from "../ui";
import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Test drives" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function AccountTestDrivesPage(): Promise<React.ReactElement> {
  const user = await requireUser("/account/test-drives");
  const drives = await getTestDrives(user);

  return (
    <Panel
      title="Test drives"
      description={`Need to reschedule? Cancel here and book a new slot, or WhatsApp us on ${SITE.phone.display}.`}
      action={
        <Link
          href="/test-drive"
          className="text-sm text-[var(--color-accent-deep)] underline-offset-4 hover:underline"
        >
          Book a test drive
        </Link>
      }
    >
      {drives.length === 0 ? (
        <EmptyState
          title="No test drives yet"
          body="Pick a car and a time that suits you — the whole booking takes about two minutes."
          cta={{ href: "/test-drive", label: "Book a test drive" }}
        />
      ) : (
        <List>
          {drives.map((d) => {
            const meta = TEST_DRIVE_STATUS[d.status];
            return (
              <Row key={d.id}>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">
                    {d.vehicleHref ? (
                      <Link href={d.vehicleHref} className="hover:underline">
                        {d.vehicleLabel}
                      </Link>
                    ) : (
                      d.vehicleLabel
                    )}
                  </p>
                  <p className="text-sm text-[var(--color-neutral-700)]">
                    {formatDateLong(d.scheduledAt)} · {formatTime(d.scheduledAt)}
                  </p>
                  <p className="font-mono text-xs text-[var(--color-neutral-500)]">{d.reference}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  {d.canCancel ? (
                    <>
                      <a
                        href={`${API_URL}/public/test-drives/${d.id}/ics`}
                        className="text-sm text-[var(--color-neutral-700)] underline-offset-4 hover:underline"
                      >
                        Add to calendar
                      </a>
                      <form action={cancelTestDriveAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <CancelButton />
                      </form>
                    </>
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
