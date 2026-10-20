import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@dealership/types";
import { Container } from "@dealership/ui/components/container";
import { Section } from "@dealership/ui/components/section";
import { BrandButton } from "@dealership/ui/components/brand-button";
import { PostCard } from "@/components/blog/post-card";
import { Prose } from "@/components/prose";
import {
  formatPostDate,
  getPublishedPost,
  getPublishedPosts,
  parseContent,
  readMinutes,
} from "@/lib/blog";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return { title: "Article not found" };
  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      images: [{ url: post.coverImage }],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.coverImage] },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const post = await getPublishedPost((await params).slug);
  if (!post) notFound();

  const blocks = parseContent(post.content);
  const more = (await getPublishedPosts(4)).filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
  };

  return (
    <>
      <article>
        <header className="pt-28 md:pt-36">
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 self-start text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-graphite)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden /> Journal
              </Link>
              {post.tags.length > 0 ? (
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent-deep)]">
                  {post.tags.join(" · ")}
                </p>
              ) : null}
              <h1
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.05 }}
              >
                {post.title}
              </h1>
              <p className="text-lg text-[var(--color-neutral-600)] md:text-xl">{post.excerpt}</p>
              <p className="text-sm text-[var(--color-neutral-500)]">
                By <span className="text-[var(--color-graphite)]">{post.authorName}</span> ·{" "}
                <time dateTime={post.publishedAt?.toISOString()}>{formatPostDate(post.publishedAt)}</time>{" "}
                · {readMinutes(post.content)} min read
              </p>
            </div>
          </Container>
        </header>

        <Container className="mt-10 md:mt-14">
          <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]">
            <Image src={post.coverImage} alt="" fill priority sizes="(min-width: 1100px) 1024px, 100vw" className="object-cover" />
          </div>
        </Container>

        <Container className="py-14 md:py-20">
          <Prose className="mx-auto">
            {blocks.map((b, i) => {
              switch (b.kind) {
                case "h2":
                  return <h2 key={i}>{b.text}</h2>;
                case "ul":
                  return (
                    <ul key={i}>
                      {b.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                case "quote":
                  return <blockquote key={i}>{b.text}</blockquote>;
                default:
                  return <p key={i}>{b.text}</p>;
              }
            })}
          </Prose>
        </Container>
      </article>

      <Section variant="warm" spacing="default">
        <Container>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-xl flex-col gap-2">
              <h2
                className="font-[family-name:var(--font-display)] tracking-[-0.02em]"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
              >
                See for yourself.
              </h2>
              <p className="text-base text-[var(--color-neutral-600)]">
                Every car in our lineup is available to test drive, six days a week.
              </p>
            </div>
            <BrandButton asChild variant="primary" size="lg">
              <Link href="/test-drive">Book a test drive</Link>
            </BrandButton>
          </div>
        </Container>
      </Section>

      {more.length > 0 ? (
        <Section spacing="default">
          <Container>
            <h2
              className="mb-10 font-[family-name:var(--font-display)] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
            >
              Keep reading
            </h2>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
