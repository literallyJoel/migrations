import chalk from "chalk";

type ProgressHandle = {
  tick: (item?: string) => void;
  stopSuccess: (msg: string) => void;
  stopError: (msg: string) => void;
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`⚠️ ${msg}`)),
  progress: (label: string, total: number): ProgressHandle => {
    const isTTY = Boolean(process.stdout?.isTTY);
    const safeTotal = Math.max(1, total);
    const barWidth = 24;
    let current = 0;
    let frameIndex = 0;
    let currentItem = "";
    let interval: ReturnType<typeof setInterval> | undefined;

    const render = () => {
      if (!isTTY) return;
      const ratio = Math.min(1, current / safeTotal);
      const filled = Math.round(barWidth * ratio);
      const percent = Math.round(ratio * 100)
        .toString()
        .padStart(3, " ");
      const bar = `${chalk.green("█".repeat(filled))}${chalk.gray(
        "░".repeat(barWidth - filled),
      )}`;
      const spinner = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
      const suffix = currentItem ? ` ${chalk.gray(currentItem)}` : "";
      const line = `${chalk.cyan(spinner)} ${chalk.bold(label)} ${chalk.gray(
        `[${current}/${total}]`,
      )} ${bar} ${percent}%${suffix}`;
      process.stdout.write(`\r\x1b[2K${line}`);
    };

    if (isTTY) {
      render();
      interval = setInterval(() => {
        frameIndex += 1;
        render();
      }, 80);
    } else {
      log.info(`${label} (0/${total})`);
    }

    const tick = (item?: string) => {
      current += 1;
      if (item) currentItem = item;
      if (isTTY) {
        render();
      } else {
        const suffix = item ? ` ${item}` : "";
        log.info(`${label} (${Math.min(current, total)}/${total})${suffix}`);
      }
    };

    const stop = (status: "success" | "error", msg: string) => {
      if (interval) clearInterval(interval);
      if (isTTY) process.stdout.write("\r\x1b[2K");
      if (status === "success") {
        log.success(msg);
      } else {
        log.error(msg);
      }
    };

    return {
      tick,
      stopSuccess: (msg: string) => stop("success", msg),
      stopError: (msg: string) => stop("error", msg),
    };
  },
};
