const VALUE_FLAGS = ["dir", "table", "file"];

export default function parseArgs<
  T extends Record<string, string | boolean | undefined>,
>(): T {
  const args = process.argv.slice(2);
  const result: Record<string, unknown> = {};
  result.command = args[0];

  for (let i = 1; i < args.length; i++) {
    const [key, val] = args[i].split("=");
    if (key.startsWith("--")) {
      const name = key.slice(2);
      const isValueFlag = VALUE_FLAGS.includes(name);
      result[name] = isValueFlag ? (val ?? undefined) : (val ?? true);
    }
  }

  return result as T;
}
