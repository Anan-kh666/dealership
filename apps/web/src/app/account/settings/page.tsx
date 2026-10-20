import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { getProfile } from "@/server/account-data";
import { requireUser } from "@/server/session";
import { Panel } from "../ui";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

export default async function AccountSettingsPage(): Promise<React.ReactElement> {
  const user = await requireUser("/account/settings");
  const profile = await getProfile(user);
  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Your details"
        description={`Member since ${formatDate(profile.createdAt)}. Your email is your sign-in and can't be changed here.`}
      >
        <ProfileForm name={profile.name} email={profile.email} phone={profile.phone ?? ""} />
      </Panel>
      <Panel title="Password">
        <PasswordForm />
      </Panel>
    </div>
  );
}
