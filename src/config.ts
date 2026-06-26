import fs from "fs";
import os from "os";
import path from "path";
import { createUser, deleteAllUsers, getAllUsers, getUser, getUserFromId } from "./db/queries/users.js";
import { createFeed, createFeedFollows, deleteFeedFollow, getAllFeeds, getFeed, getFeedsFromUser } from "./db/queries/feeds.js";
import { Feed, User } from "./db/schema.js";

export type Config = {
    dbUrl: string,
    currentUserName: string
};

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function setUser(username: string): void {
    const newConfig: Config = {
        dbUrl: "postgres://blakewilson:@localhost:5432/gator?sslmode=disable",
        currentUserName: username
    };
    writeConfig(newConfig);
};

export function readConfig(): Config {
    const configFilePath = getConfigFilePath();
    const readConfigFile = fs.readFileSync(configFilePath, {encoding: "utf-8"});
    const parsedConfig: Config = JSON.parse(readConfigFile);
    return parsedConfig;
};

function getConfigFilePath() {
    const homeDir: string = os.homedir();
    const filePath: string = "/.gatorconfig.json";
    const fullPath: string = path.join(homeDir, filePath);
    return fullPath;
}

function writeConfig(conf: Config): void {
    const JSONConfig = JSON.stringify(conf); 
    const file = getConfigFilePath();
    fs.writeFileSync(file, JSONConfig);
}

// Handlers

export async function handlerLogin(cmdName: string, ...args: string[]){
    if(!args || args.length === 0){
        throw new Error("No Username Given");
    }
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }
    const userExists = await getUser(args[0])
    if(!userExists){
        throw new Error("User Doesn't Exist");
    }
    setUser(args[0]);
    console.log("User Set");
    return;
}

export async function handlerRegister(cmdName: string, ...args: string[]){
    if(!args || args.length === 0){
        throw new Error("No Username Given");
    }
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }
    const userExists = await getUser(args[0])
    if(userExists){
        throw new Error("User Already Exists");
    }
    await createUser(args[0]);
    setUser(args[0]);
    const newUser = await getUser(args[0]);
    console.log("User Registered");
    console.log(newUser);
    return;
}
export async function handlerReset(cmdName: string, ...args: string[]){
    if(args.length !== 0){
        throw new Error("Too many Arguments Given");
    }
    await deleteAllUsers();
    console.log("Users Reset");
    return;
}

export async function handlerGetUsers(cmdName: string, ...args: string[]){
    if(args.length !== 0){
        throw new Error("Too many Arguments Given");
    }
    const users = await getAllUsers();
    const cnf = readConfig();
    for (const user of users){
        const currentUser = cnf.currentUserName === user.name ? " (current)" : "";
        console.log(`* ${user.name}${currentUser}`);
    };
    return;
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]){
    if(!args || args.length < 2){
        throw new Error("No Feed or URL Given");
    }
    if (args.length >= 3){
        throw new Error("Too many Arguments Given");
    }
    const name = args[0];
    const URL = args[1];

    const newCreatedFeed: Feed = await createFeed(name, URL, user.id);
    await createFeedFollows(newCreatedFeed.id,newCreatedFeed.userId)
    console.log(newCreatedFeed.name);
    console.log(user.name);
}

export async function handlerGetFeeds(cmdName: string, ...args: string[]){
    if(args.length !== 0){
        throw new Error("Too many Arguments Given");
    }
    const feeds: Feed[] = await getAllFeeds();
    for (const feed of feeds){
        
        const feedUser: User = await getUserFromId(feed.userId);
        
        console.log(`* Feed Name: ${feed.name} *`);
        console.log(`Feed URL: ${feed.url}`);
        console.log(`Username: ${feedUser.name}`);
    };
    return;
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]){
    if(!args || args.length === 0){
        throw new Error("No URL Given");
    }
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }

    const feedURL = args[0];
    const lookupFeed: Feed = await getFeed(feedURL);
    await createFeedFollows(lookupFeed.id, user.id);

    console.log(`Feed Name: ${lookupFeed.name}`);
    console.log(`Username: ${user.name}`);
    return;
}

export async function handlerFollowing(cmdName: string, user: User, ...args: string[]){
    if(!args || args.length !== 0){
        throw new Error("Too many Arguments Given");
    }
    const feedFollows = await getFeedsFromUser(user.id);
    console.log(`Username: ${user.name}`);
    for (const feedFollow of feedFollows){
        console.log(`Feed Name: ${feedFollow.feedname}`);
    }
    return;
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]){
    if(!args || args.length === 0){
        throw new Error("No URL Given");
    }
    if (args.length > 1){
        throw new Error("Too many Arguments Given");
    }
    const feedURL = args[0];
    const feedFollowToDelete = await getFeed(feedURL) 
    await deleteFeedFollow(feedFollowToDelete.id, user.id)
    return;
}

//Commands

export async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): Promise<void> {
    registry[cmdName] = handler;
};

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]): Promise<void>{
    
    const handler = registry[cmdName];
    if(!handler){
        throw new Error("Handler Doesn't Exist");
    }
    await handler(cmdName,...args);
};

