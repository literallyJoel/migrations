import path from "path";
import { existsSync } from "fs";
import { config as loadEnv } from "dotenv";

loadEnv();

export type MigrationConfig = {
  migrationsDir?: string;
  sql?: any;
  rollbackDir?: string;
};

export async function loadConfig(): Promise<MigrationConfig> {
  const CONFIG_PATHS = [
    path.resolve("migrations.config.ts"),
    path.resolve("migrations.config.js"),
  ];

  for (const file of CONFIG_PATHS) {
    if (existsSync(file)) {
      const mod = await import(file);
      return mod.default || mod;
    }
  }

  return {
    migrationsDir: process.env.MIGRATIONS_DIR ?? path.resolve("./migrations"),
    rollbackDir: process.env.ROLLBACK_DIR,
  };
}
