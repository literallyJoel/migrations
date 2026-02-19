import { log } from "./logger";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type DebugOptions = {
  failAt?: number;
  speed: number;
};

function parseDebugOptions(): DebugOptions {
  const args = process.argv.slice(2);
  let speed = 1;
  let simulateError = false;

  for (const arg of args) {
    if (arg.startsWith("--speed=")) {
      const val = Number(arg.split("=")[1]);
      if (Number.isFinite(val) && val > 0) speed = val;
    }
    if (arg === "--error") {
      simulateError = true;
    }
  }

  return {
    speed,
    failAt: simulateError ? 4 : undefined,
  };
}

async function runPhase(
  label: string,
  items: string[],
  options: DebugOptions,
  phaseOffset = 0
) {
  const progress = log.progress(label, items.length);
  const stepMs = Math.max(20, Math.round(350 / options.speed));

  try {
    for (let i = 0; i < items.length; i++) {
      const itemNumber = phaseOffset + i + 1;
      await wait(stepMs);
      if (options.failAt === itemNumber) {
        throw new Error(`Simulated failure at step ${itemNumber}: ${items[i]}`);
      }
      progress.tick(items[i]);
    }
    progress.stopSuccess(`${label} complete.`);
    return phaseOffset + items.length;
  } catch (err) {
    progress.stopError(`${label} failed.`);
    throw err;
  }
}

async function main() {
  const options = parseDebugOptions();
  log.info(`Debug UI simulation started (speed=${options.speed}x).`);
  if (options.failAt) log.warn("Error simulation is enabled (--error).");

  let step = 0;
  step = await runPhase(
    "Applying migrations",
    [
      "001_create_users.sql",
      "002_add_indexes.sql",
      "003_create_posts.sql",
      "004_add_foreign_keys.sql",
      "005_backfill_data.sql",
    ],
    options,
    step
  );

  await wait(Math.max(150, Math.round(500 / options.speed)));

  await runPhase(
    "Rolling back migrations",
    ["005_backfill_data.sql", "004_add_foreign_keys.sql", "003_create_posts.sql"],
    options,
    step
  );

  log.success("Debug UI simulation finished.");
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
