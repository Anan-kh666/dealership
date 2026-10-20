import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { Reveal } from "@/components/reveal";
import { PostCard } from "@/components/blog/post-card";
import { getPublishedPosts } from "@/lib/blog";

export async function BlogTeaser(): Promise<React.ReactElement | null> {
  const posts = await getPublishedPosts(3);
  if (posts.length === 0) return null;

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
          {posts.map((post, idx) => (
            <li key={post.id}>
              <Reveal delay={Math.min(idx, 2) * 0.06}>
                <PostCard post={post} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
