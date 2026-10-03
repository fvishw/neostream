import "dotenv/config"; // Manually load your .env file
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Path to your Prisma schema file
  schema: "prisma/schema.prisma", 
  
  // Migration and seeding configuration
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js", 
  },

  // Centralized database connection definition
  datasource: {
    url: env("DATABASE_URL"), 
  },
});
