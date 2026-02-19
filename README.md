# @literallyjoel/migrations

> Simple, universal SQL migration management for **Bun** and **Node.js**

![npm](https://img.shields.io/npm/v/@literallyjoel/migrations?color=blue)
![license](https://img.shields.io/badge/license-MIT-green)
![bun](https://img.shields.io/badge/runs%20on-bun-orange)
![node](https://img.shields.io/badge/runs%20on-node.js-yellowgreen)

---

## Features

- ✅ Works in **Bun** _and_ **Node.js**
- 📝 Plain SQL migrations — no ORM dependency
- 🔧 Customizable migrations & rollback directories
- ⚙️ Easy configuration via `migrations.config.ts`
- 📊 Tracks applied migrations in your database
- 🔄 Supports Bun's native `sql` or Node's `pg` driver
- 🎯 TypeScript & ESM native

---

## 🚀 Installation

### Using npm

```bash
npm install -D @literallyjoel/migrations
```

### Using pnpm

```bash
pnpm add -D @literallyjoel/migrations
```

### Using Bun

```bash
bun add -d @literallyjoel/migrations
```

---

## 🔧 Setup

Create a **`migrations.config.ts`** (or `.js`) file in your project root:

### Example (Bun with native SQL)

```ts
import { sql } from "bun";
import path from "path";

export default {
  migrationsDir: path.resolve("./src/db/migrations"),
  rollbackDir: path.resolve("./src/db/rollbacks"),
  sql, // Bun's built-in SQL client
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

### Example (ESM .js config)

```js
import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  sql: pool,
  migrationsDir: path.resolve("./migrations"),
  rollbackDir: path.resolve("./rollbacks"),
};
```

> **Tip:** Add a `.env` file with your `DATABASE_URL` for easy connection management.

---

## 📖 CLI Usage

Run commands using `npx` (Node) or `bunx` (Bun):

### Create a new migration

```bash
npx migrate create --table=users
# or
bunx migrate create --table=users
```

This creates a timestamped SQL file like `1234567890_users.sql` in your migrations directory.

### Apply all pending migrations

```bash
npx migrate apply
```

Applies all migrations that haven't been run yet.

### Apply a specific migration

```bash
npx migrate apply --file=1234567890_users.sql
```

### Rollback migrations

```bash
npx migrate rollback
```

Runs all rollback scripts in your rollback directory (in reverse order).

### Custom directory

```bash
npx migrate create --table=posts --dir=./database/migrations
npx migrate apply --dir=./database/migrations
npx migrate rollback --dir=./database/rollbacks
```

---

## 💻 Programmatic Usage

You can also use the library programmatically in your code:

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

// Apply a specific migration
await applyMigrations({ file: "1234567890_users.sql" }, config);

// Rollback
await rollbackMigrations(config);
```

---

## 🔍 How It Works

1. **Migration Storage**: Migrations are stored as `.sql` files with timestamps
2. **Tracking**: Applied migrations are tracked in an `applied_migrations` table
3. **Transactions**: Each migration runs in a transaction for safety
4. **Failure Handling**: If a migration fails, it's rolled back and the process stops

---

## 🌍 Environment Variables

You can configure the tool using environment variables:

```bash
MIGRATIONS_DIR=./db/migrations
ROLLBACK_DIR=./db/rollbacks
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```

These will be used as defaults if no config file is found.

---

## 📝 Example Migration

**`migrations/1234567890_users.sql`:**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**`rollbacks/1234567890_users.sql`:**

```sql
DROP TABLE IF EXISTS users;
```

---

## 📄 License

MIT

---

## 🐛 Troubleshooting

### "No SQL client found"

Make sure you've created a `migrations.config.ts` file and configured the `sql` property with your database client.

### "Migrations directory does not exist"

The migrations directory is created automatically when you run `create`, but make sure the path in your config is correct.

### Module not found errors

Make sure you're using Node.js 18+ and that your project is configured for ESM (has `"type": "module"` in package.json).

---

## 🔗 Links

- [GitHub Repository](https://github.com/literallyjoel/migrations)
- [npm Package](https://www.npmjs.com/package/@literallyjoel/migrations)
- [Report Issues](https://github.com/literallyjoel/migrations/issues)
