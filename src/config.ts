import path from "path";
import { existsSync } from "fs";
import { config as loadEnv } from "dotenv";

loadEnv();

export type QueryResultRow = Record<string, unknown>;
export type QueryResult = { rows: QueryResultRow[] };

export type QuerySqlClient = {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
};

export type BunSqlTx = {
  file: (filePath: string) => Promise<unknown>;
  (chunks: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
};

export type BunSqlClient = {
  begin: (fn: (tx: BunSqlTx) => Promise<void>) => Promise<void>;
  file: (filePath: string) => Promise<unknown>;
  unsafe: (sql: string) => Promise<unknown>;
  (
    chunks: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<QueryResultRow[]>;
};

export type SQLClient = QuerySqlClient | BunSqlClient;

export type MigrationConfig = {
  migrationsDir?: string;
  sql?: SQLClient;
  rollbackDir?: string;
};

export function isBunSqlClient(sql: SQLClient): sql is BunSqlClient {
  return typeof (sql as { file?: unknown }).file === "function";
}

export async function loadConfig(): Promise<MigrationConfig> {
  const CONFIG_PATHS = [
    path.resolve("migrations.config.js"),
    path.resolve("migrations.config.ts"),
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
