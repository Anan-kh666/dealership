import "server-only";
import { prisma, type BlogPost } from "@dealership/db";
import { readMinutes } from "./blog-content";

export type PostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "coverImage" | "authorName" | "publishedAt" | "tags"
> & { readMinutes: number };

const dateFmt = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

export function formatPostDate(d: Date | null): string {
  return d ? dateFmt.format(d) : "Draft";
}

/** Published posts, newest first. Returns [] if the DB is unreachable. */
export async function getPublishedPosts(take?: number): Promise<PostSummary[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      ...(take ? { take } : {}),
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      authorName: p.authorName,
      publishedAt: p.publishedAt,
      tags: p.tags,
      readMinutes: readMinutes(p.content),
    }));
  } catch {
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post?.publishedAt || post.publishedAt > new Date()) return null;
    return post;
  } catch {
    return null;
  }
}

export { parseContent, readMinutes, type Block } from "./blog-content";
