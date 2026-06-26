import { CommandsRegistry, handlerAddFeed, handlerFollow, handlerFollowing, handlerGetFeeds, handlerGetUsers, handlerLogin, handlerRegister, handlerReset, handlerUnfollow, readConfig, registerCommand, runCommand, setUser } from "./config.js"
import { fetchFeed, handlerAgg, handlerBrowse } from "./db/RSS/parse.js";
import { middlewareLoggedIn } from "./middleware.js";

async function main() {
    const Commands: CommandsRegistry = {};
    await registerCommand(Commands, "login", handlerLogin);
    await registerCommand(Commands, "register", handlerRegister);
    await registerCommand(Commands, "reset", handlerReset);
    await registerCommand(Commands, "users", handlerGetUsers);
    await registerCommand(Commands, "agg", handlerAgg);
    await registerCommand(Commands, "addfeed", middlewareLoggedIn(handlerAddFeed));
    await registerCommand(Commands, "feeds", handlerGetFeeds);
    await registerCommand(Commands, "follow", middlewareLoggedIn(handlerFollow));
    await registerCommand(Commands, "following", middlewareLoggedIn(handlerFollowing));
    await registerCommand(Commands, "unfollow", middlewareLoggedIn(handlerUnfollow));
    await registerCommand(Commands, "browse", middlewareLoggedIn(handlerBrowse));


    const cmdName = process.argv[2];
    if(!cmdName){
        throw new Error("No Command Given");
    }
    const args = process.argv.slice(3,);
    await runCommand(Commands, cmdName, ...args);
    process.exit(0);
}

main();