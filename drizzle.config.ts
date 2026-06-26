import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/config";

const cnf= readConfig()
const dbURL = cnf.dbUrl

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbURL
  },
});