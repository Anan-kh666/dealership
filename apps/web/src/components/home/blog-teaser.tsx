import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { Reveal } from "@/components/reveal";
import { blogPosts } from "@/data/placeholders";

export function BlogTeaser(): React.ReactElement {
  return (
    <Section spacing="default">
      <Container>
        <Reveal>
          <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                Journal
              </p>
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(32px, 4.5vw, 48px)", lineHeight: 1.05 }}
              >
                Latest from the road.
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-accent)]"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
          {blogPosts.map((post, idx) => (
            <li key={post.slug}>
              <Reveal delay={Math.min(idx, 2) * 0.06}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-4 rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]"
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                    <span>{post.date}</span>
                    <span aria-hidden className="mx-2">·</span>
                    <span>{post.readTime}</span>
                  </p>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-[-0.02em] line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-base text-[var(--color-neutral-600)] line-clamp-3">
                    {post.excerpt}
                  </p>
                  <span
                    aria-hidden
                    className="mt-2 flex items-center justify-end gap-2 text-sm text-[var(--color-graphite)] opacity-0 transition-[opacity,transform] duration-[var(--duration-standard)] ease-[var(--ease-out-soft)] group-hover:translate-x-[-4px] group-hover:opacity-100"
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
