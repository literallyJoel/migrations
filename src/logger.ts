import chalk from "chalk";

export const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`⚠️ ${msg}`)),
};
