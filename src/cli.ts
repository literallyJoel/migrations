#!/usr/bin/env bun
import { loadConfig } from "./config";
import parseArgs from "./util/parseArgs";
import { createMigration } from "./createMigration";
import { applyMigrations } from "./applyMigrations";
import { rollbackMigrations } from "./rollbackMigrations";
import { log } from "./logger";

const args = parseArgs<{
  command: string;
  table?: string;
  file?: string;
  dir?: string;
}>();

const config = await loadConfig();

switch (args.command) {
  case "create":
    await createMigration({ table: args.table, dir: args.dir }, config);
    break;
  case "apply":
    await applyMigrations({ file: args.file, dir: args.dir }, config);
    break;
  case "rollback":
    await rollbackMigrations(config);
    break;
  default:
    log.info(`Usage:
  bunx migrate create --table=users
  bunx migrate apply
  bunx migrate rollback
`);
    break;
}
