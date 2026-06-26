import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUser(name: string) {
  const [result] = await db.select().from(users).where(eq(users.name, name));
  return result;
}

export async function deleteAllUsers(){
    await db.delete(users);
}

export async function getAllUsers() {
  const result = await db.select().from(users);
  return result;
}

export async function getUserFromId(userId: string) {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  return result;
}