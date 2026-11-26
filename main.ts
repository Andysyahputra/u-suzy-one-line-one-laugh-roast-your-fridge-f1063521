// One Line, One Laugh: Roast Your Fridge
// Deterministic Node 22 TypeScript entry writer (stdlib only, no network).
// Writes exactly one roast line (plus a single trailing newline) to
// <output-dir>/entry.txt. Anchor: 00c4131 / drand round 34268704.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "My fridge's ice maker died two years ago, but every morning it still grinds hopefully, like a coworker who keeps saying 'let's circle back.'";

function resolveOutputDir(argv: string[]): string {
  for (const arg of argv) {
    if (arg.startsWith("--output-dir=")) {
      const value = arg.slice("--output-dir=".length);
      if (value.trim().length > 0) return value;
    }
  }
  const flagIndex = argv.indexOf("--output-dir");
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    return argv[flagIndex + 1];
  }
  const envDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (envDir && envDir.trim().length > 0) {
    return envDir;
  }
  return "/output";
}

// Collect every validation failure instead of stopping at the first one,
// so a bad entry reports the full picture in one run.
function validateEntry(text: string): string[] {
  const failures: string[] = [];
  const bytes = Buffer.from(text, "utf8");
  if (bytes.toString("utf8") !== text) {
    failures.push("entry is not valid UTF-8");
  }
  const charCount = [...text].length;
  if (charCount < 1 || charCount > 200) {
    failures.push(`entry must be 1-200 characters, got ${charCount}`);
  }
  if (text.trim().length === 0) {
    failures.push("entry must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    failures.push("entry must be a single line");
  }
  return failures;
}

function main(): void {
  const failures = validateEntry(ENTRY);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`validation failed: ${failure}`);
    process.exit(1);
  }
  const outputDir = resolveOutputDir(process.argv.slice(2));

  // Create the output directory if missing; never delete the directory
  // itself (the grader filesystem is read-only there), only its contents.
  mkdirSync(outputDir, { recursive: true });
  for (const name of readdirSync(outputDir)) {
    rmSync(join(outputDir, name), { recursive: true, force: true });
  }

  const payload = ENTRY + "\n";
  const target = join(outputDir, "entry.txt");
  writeFileSync(target, payload, "utf8");

  // Verify what was written: read it back and demand byte-identical content.
  const written = readFileSync(target);
  if (!written.equals(Buffer.from(payload, "utf8"))) {
    console.error("verification failed: entry.txt does not match the entry");
    process.exit(1);
  }
  console.log(
    `wrote entry.txt (${[...ENTRY].length} chars, ${written.length} bytes) to ${outputDir}`,
  );
}

main();
