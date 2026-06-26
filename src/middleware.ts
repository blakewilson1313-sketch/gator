import { User } from "./db/schema.js";
import { CommandHandler, readConfig, } from "./config.js";
import { getUser } from "./db/queries/users.js";


type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;


export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    const userName = config.currentUserName;
    if (!userName) {
        throw new Error(`User ${userName} not found`);
    }
    const user = await getUser(userName);
    if (!user) {
        throw new Error(`User ${userName} not found`);
    }
    await handler(cmdName, user, ...args);
  };
}