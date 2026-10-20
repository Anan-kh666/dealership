import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { BLOG_POSTS, seedUsers } from "./seed-content.js";

/*
 * Journal posts and demo accounts.
 *
 * The vehicle catalogue (models, trims, colours, options, demo stock) is no
 * longer seeded here: it lives in /models/<slug>/vehicle.json and is loaded
 * by `@dealership/vehicles` — `pnpm db:seed` runs both.
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // ============ JOURNAL ============
  for (const post of BLOG_POSTS) {
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      authorName: post.authorName,
      publishedAt: new Date(post.publishedAt),
      tags: post.tags,
      metaTitle: post.title,
      metaDescription: post.metaDescription,
    };
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: data,
      create: { slug: post.slug, ...data },
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Journal seed complete — ${BLOG_POSTS.length} posts.`);

  // ============ ACCOUNTS ============
  // Upsert keeps existing passwords intact on re-seed (only `create`
  // hashes the default), so a changed staging password survives.
  const users = seedUsers();
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, phone: u.phone, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        passwordHash: await hash(u.password, 12),
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log(
    `Account seed complete — ${users.map((u) => `${u.email} (${u.role})`).join(", ")}.`,
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
