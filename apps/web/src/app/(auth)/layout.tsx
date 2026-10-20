import Image from "next/image";
import { SiteChrome } from "@/components/site-chrome";
import { AUTH_IMAGE } from "@/data/media";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <SiteChrome>
      <AuthFrame>{children}</AuthFrame>
    </SiteChrome>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid min-h-screen pt-20 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[var(--color-graphite)] lg:block">
        <Image
          src={AUTH_IMAGE}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-12 text-white xl:p-16">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Your account</p>
          <p
            className="max-w-md font-[family-name:var(--font-display)] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 3.2vw, 44px)", lineHeight: 1.08 }}
          >
            Bookings, applications and trade-ins — in one place.
          </p>
          <p className="max-w-md text-sm text-white/75">
            Track every request you&rsquo;ve made with us, from the first test drive to the day
            you collect your keys.
          </p>
        </div>
      </aside>

      <section className="flex items-start justify-center px-4 py-12 md:px-8 md:py-20 lg:items-center">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
