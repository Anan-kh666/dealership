import { redirect } from "next/navigation";
import { prisma } from "@dealership/db";
import { auth } from "@/server/auth";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { ChangeEmailForm } from "./change-email-form";
import { DeleteAccountSection } from "./delete-account";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account/profile");
  const sp = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      phone: true,
      icNumber: true,
      image: true,
      passwordHash: true,
    },
  });
  if (!user) redirect("/sign-in?callbackUrl=/account/profile");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] text-[var(--color-graphite)]">
          Profile
        </h1>
        {sp.email === "changed" ? (
          <div className="mt-4 rounded-md bg-[#FBE9E5] px-4 py-3 text-sm text-[var(--color-graphite)]">
            Your email has been updated.
          </div>
        ) : null}
      </div>

      <Card title="Personal details">
        <ProfileForm
          defaults={{
            name: user.name ?? "",
            phone: user.phone ?? "",
            icNumber: user.icNumber ?? "",
            image: user.image ?? "",
          }}
        />
      </Card>

      <Card title="Email">
        <p className="mb-4 text-sm text-[var(--color-neutral-700)]">
          Current email: <strong>{user.email}</strong>. Changing it requires
          re-verification — we&rsquo;ll email a confirmation link to the new
          address before it switches over.
        </p>
        <ChangeEmailForm />
      </Card>

      {user.passwordHash ? (
        <Card title="Password">
          <ChangePasswordForm />
        </Card>
      ) : null}

      <Card title="Delete account">
        <DeleteAccountSection />
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-md border border-[var(--color-neutral-200)] bg-white p-6">
      <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
