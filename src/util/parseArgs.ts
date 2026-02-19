const VALUE_FLAGS = ["dir", "table", "file"];

export default function parseArgs<
  T extends Record<string, string | boolean | undefined>,
>(): T {
  const args = process.argv.slice(2);
  const result: Record<string, unknown> = {};
  result.command = args[0];

  for (let i = 1; i < args.length; i++) {
    const eqIndex = args[i].indexOf("=");
    const key = eqIndex === -1 ? args[i] : args[i].slice(0, eqIndex);
    const val = eqIndex === -1 ? undefined : args[i].slice(eqIndex + 1);
    if (key.startsWith("--")) {
      const name = key.slice(2);
      const isValueFlag = VALUE_FLAGS.includes(name);
      result[name] = isValueFlag ? (val ?? undefined) : (val ?? true);
    }
  }

  return result as T;
}
