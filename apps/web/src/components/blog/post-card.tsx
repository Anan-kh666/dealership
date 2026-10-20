import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPostDate, type PostSummary } from "@/lib/blog";

export function PostCard({
  post,
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
}: {
  post: PostSummary;
  sizes?: string;
  priority?: boolean;
}): React.ReactElement {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-4 rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-4"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]">
        <Image
          src={post.coverImage}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
        />
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
        <time dateTime={post.publishedAt?.toISOString()}>{formatPostDate(post.publishedAt)}</time>
        <span aria-hidden className="mx-2">
          ·
        </span>
        <span>{post.readMinutes} min read</span>
      </p>
      <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-2xl leading-tight tracking-[-0.02em]">
        {post.title}
      </h3>
      <p className="line-clamp-3 text-base text-[var(--color-neutral-600)]">{post.excerpt}</p>
      <span className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-deep)]">
        Read article
        <ArrowRight
          aria-hidden
          className="h-4 w-4 transition-transform duration-[var(--duration-standard)] group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
