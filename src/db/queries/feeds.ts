import { eq, sql, } from "drizzle-orm";
import { db } from "../index.js";
import { feed_follows, feeds } from "../schema.js";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db.insert(feeds).values({name: name, url: url, userId: userId}).returning();
  return result;
}

export async function getAllFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function getFeed(URL: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, URL));
  return result;
}

export async function createFeedFollows(feedId: string, userId: string) {
  const [result] = await db.insert(feed_follows).values({feedId: feedId, userId: userId}).returning();
  return result;
}

export async function getFeedsFromUser(userId: string) {
  const result = await db.select({feedname: feeds.name}).from(feed_follows).where(eq(feed_follows.userId, userId)).innerJoin(feeds, eq(feeds.id, feed_follows.feedId));
  return result;
}

export async function deleteFeedFollow(feedId: string, userId: string) {
  const [result] = await db.delete(feed_follows).where(eq(feed_follows.userId, userId) && eq(feed_follows.feedId, feedId));
  return result;
}

export async function markFeedFetched(feedId: string) {
  await db.update(feeds).set({lastFetchedAt: new Date()}).where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
    const [result] = await db.select().from(feeds).orderBy(sql`${feeds.lastFetchedAt} asc nulls first`)
    return result;
}