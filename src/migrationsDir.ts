import path from "path";
import { fileURLToPath } from "url";
import type { MigrationConfig } from "./config";

export function migrationsDir(
  args: Record<string, string>,
  config?: MigrationConfig
) {
  return (
    args.dir ??
    config?.migrationsDir ??
    process.env["MIGRATIONS_DIR"] ??
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../migrations"
    )
  );
}
