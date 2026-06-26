import { XMLParser } from "fast-xml-parser";
import { getFeed, getNextFeedToFetch, markFeedFetched } from "../queries/feeds.js";
import { createPost, getPostByURL, getPostsForUser } from "../queries/posts.js";
import { User } from "../schema.js";


export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(url: string): Promise<void> {
    const rawRSS = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": "gator",
        },
    });
    const RSS = await rawRSS.text()
    const parser = new XMLParser({processEntities: false, maxNestedTags: 1000});
    const rssFeed = parser.parse(RSS);
    if(!rssFeed.rss){
        throw new Error("No RSS Feed Returned");
    }
    const fullFeed: RSSFeed = rssFeed.rss;
    if(!fullFeed.channel){
        throw new Error("No Channel");
    }
    if(!fullFeed.channel.title|| !fullFeed.channel.link || !fullFeed.channel.description){
        throw new Error("Missing Metadata");
    }
    let feedItems: RSSItem[] = [];
    if (Array.isArray(fullFeed.channel.item)) {
        feedItems = fullFeed.channel.item;
    } else if (fullFeed.channel.item){
        feedItems = [fullFeed.channel.item]
    }
    for (const feedItem of feedItems){
        if(!feedItem.title || !feedItem.link){
            continue;
        } else {
            const postExists = await getPostByURL(feedItem.link)
            if (postExists){
                continue;
            }
            const cleanPub = new Date(feedItem.pubDate);
            const cleanPublishedAt = isNaN(cleanPub.getTime()) ? null : cleanPub;
            const feed = await getFeed(url);
            await createPost(feedItem.link, feedItem.title, feedItem.description, cleanPublishedAt, feed.id);
        };
    }
}

export async function scrapeFeeds(): Promise<void> {
    const nextFeed = await getNextFeedToFetch();
    await fetchFeed(nextFeed.url); 
    await markFeedFetched(nextFeed.id);
}

function parseDuration(durationStr: string): number{
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if(!match){
        throw new Error("Invalid Interval");
    }
    const unitComponent: string = match[2];
    const timeComponent: number = parseInt(match[1]);
    switch(unitComponent){
        case "ms":
            return timeComponent;
        case "s":
            return timeComponent * 1000;
        case "m":
            return timeComponent * 1000 * 60;
        case "h":
            return timeComponent * 1000 * 60 * 60;
        default:
            throw new Error("Invalid Unit")

    }
}

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
    if(!args || args.length === 0){
        throw new Error("No Inteval Given");
    }
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }
    const inputInterval = args[0];
    const duration = parseDuration(inputInterval);
    console.log(`Collecting feeds every ${duration}ms`)
    await scrapeFeeds();
    const interval = setInterval(async () => {
    await scrapeFeeds();
    }, duration);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]){
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }
    const numberOfPosts = args[0] && !isNaN(parseInt(args[0]))? parseInt(args[0]) : 2;
    const posts = await getPostsForUser(user.id, numberOfPosts)
    for (const post of posts){
        console.log(`Title: ${post.posts.title}`);
        console.log(`URL: ${post.posts.url}`);
        console.log(`Description: ${post.posts.description}`);
        console.log(`Published At: ${post.posts.publishedAt}`);
        console.log("-----------------------------------------");
    }
}