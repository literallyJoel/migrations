# JV Migrations

> Basic migration management for **Bun** and **Node**  

![npm](https://img.shields.io/npm/v/@literallyjoel/migrations?color=blue)
![license](https://img.shields.io/badge/license-MIT-green)
![bun](https://img.shields.io/badge/runs%20on-bun-orange)
![node](https://img.shields.io/badge/runs%20on-node.js-yellowgreen)

---

## Features

- Works in **Bun** *and* **Node**
- Plain SQL migrations — no ORM dependency
- Customizable migrations & rollback directories
- Easy configuration via `migrations.config.ts`
- Tracks applied migrations in your database
- Supports Bun’s `sql` or Node’s `pg` (`.query`)
- TypeScript & ESM native

---

## 🚀 Installation

### Bun

```bash
bun add -d @literallyjoel/migrations
```

### Node / npm / pnpm

```bash
npm install -D @literallyJoel/migrations
# or
pnpm add -D @literallyJoel/migrations
```

---

## 🔧 Setup

Create a **`migrations.config.ts`** file in your project root:

### Example (Bun)

```ts
import { sql } from "bun";
import path from "path";

export default {
  migrationsDir: path.resolve("./src/db/migrations"),
  rollbackDir: path.resolve("./src/db/rollbacks"),
  sql, // Bun’s built-in SQL client
};
```

### Example (Node.js + pg)

```ts
import { Pool } from "pg";
import path from "path";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  sql: pool, // Any client with .query()
  migrationsDir: path.resolve("./migrations"),
  rollbackDir: path.resolve("./rollbacks"),
};
```

> **Tip:** Add `.env` with your `DATABASE_URL`.  
>  it's automatically loaded using `dotenv`.

---

## CLI Usage

Run commands using `bunx` (or `npx`):

```bash
# Create a new migration
bunx migrate create --table=users

# Apply all new migrations
bunx migrate apply

# Rollback (if rollback scripts exist)
bunx migrate rollback
```

You can also specify a directory:

```bash
bunx migrate create --table=posts --dir=./database/migrations
```

---

## Programmatic Usage

```ts
import {
  loadConfig,
  createMigration,
  applyMigrations,
  rollbackMigrations,
} from "@literallyjoel/migrations";

const config = await loadConfig();

// Create a migration manually
await createMigration({ table: "users" }, config);

// Apply migrations
await applyMigrations({}, config);

// Rollback
await rollbackMigrations(config);
```

---

## How It Works

- Stores migrations as `.sql` files.
- Tracks which migrations were applied via an `applied_migrations` table.
- Each file is run in a transaction; failures stop migration safely.

## Env Vars

Supports the following env vars for configuration:

- MIGRATIONS_DIR
- ROLLBACK_DIR
- DATABASE_URL