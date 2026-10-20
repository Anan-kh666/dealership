import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { PageHero } from "@/components/page-hero";
import { PostCard } from "@/components/blog/post-card";
import { formatPostDate, getPublishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Long-term tests, ownership guides and plain-language explainers from the people who sell and service our cars.",
};

export default async function BlogIndexPage(): Promise<React.ReactElement> {
  const posts = await getPublishedPosts();
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Journal"
        title="Notes from the road."
        intro="Long-term tests, ownership guides and plain-language explainers — written by the people who sell and service our cars."
      />

      <Section spacing="default">
        <Container>
          {!lead ? (
            <p className="py-16 text-center text-[var(--color-neutral-600)]">
              New stories are on their way. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-16">
              <Link
                href={`/blog/${lead.slug}`}
                className="group grid gap-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-4 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]">
                  <Image
                    src={lead.coverImage}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="object-cover transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                    Latest · {formatPostDate(lead.publishedAt)} · {lead.readMinutes} min read
                  </p>
                  <h2
                    className="font-[family-name:var(--font-display)] tracking-[-0.02em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-8"
                    style={{ fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1.08 }}
                  >
                    {lead.title}
                  </h2>
                  <p className="text-base text-[var(--color-neutral-600)] md:text-lg">{lead.excerpt}</p>
                  <p className="text-sm text-[var(--color-neutral-500)]">By {lead.authorName}</p>
                </div>
              </Link>

              {rest.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-6 gap-y-14 border-t border-[var(--color-neutral-200)] pt-16 md:grid-cols-3">
                  {rest.map((p) => (
                    <li key={p.id}>
                      <PostCard post={p} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
