export default function parseArgs<
  T extends Record<string, string | boolean | undefined>
>(): T {
  const args = process.argv.slice(2);
  const result: Record<string, any> = {};
  result.command = args[0];

  for (let i = 1; i < args.length; i++) {
    const [key, val] = args[i].split("=");
    if (key.startsWith("--")) {
      result[key.slice(2)] = val ?? true;
    }
  }

  return result as T;
}
