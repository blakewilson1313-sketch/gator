import { desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { feed_follows, posts } from "../schema.js";

export async function createPost(postURL: string, postTitle: string, postDescript: string, postPubDate: Date | null, feedID: string) {
  const [result] = await db.insert(posts).values({title: postTitle, url: postURL, description: postDescript, publishedAt: postPubDate, feedId: feedID}).returning();
  return result;
}

export async function getPostsForUser(userID: string, numberOfPosts: number) {
    const result = await db
    .select()
    .from(posts)
    .innerJoin(feed_follows, eq(posts.feedId, feed_follows.feedId))
    .where(eq(feed_follows.userId, userID))
    .orderBy(desc(posts.publishedAt))
    .limit(numberOfPosts);
  return result;
}

export async function getPostByURL(url: string) {
    const [result] = await db
    .select()
    .from(posts)
    .where(eq(posts.url, url))
  return result;
}
