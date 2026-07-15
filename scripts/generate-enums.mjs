// Generates TypeScript enums from the Prisma schema so the frontend shares a
// single source of truth with the database. Run with: node scripts/generate-enums.mjs
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../apps/api/prisma/schema.prisma");
const outPath = resolve(__dirname, "../packages/shared-types/src/enums.ts");

const schema = await import("node:fs").then((fs) => fs.readFileSync(schemaPath, "utf8"));

const keyFor = (value) =>
  value
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "");

const blocks = [...schema.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)];
if (blocks.length === 0) {
  console.error("No enums found in schema");
  process.exit(1);
}

const parts = [
  "// AUTO-GENERATED from apps/api/prisma/schema.prisma by scripts/generate-enums.mjs.",
  "// Do not edit by hand. Run `node scripts/generate-enums.mjs` after changing enums.",
  "",
];

for (const block of blocks) {
  const name = block[1];
  const values = block[2]
    .split("\n")
    .map((line) => line.replace(/^\s*\/\/.*/, "").trim())
    .filter((line) => line && !line.startsWith("//"))
    .filter(Boolean);
  parts.push(`export enum ${name} {`);
  for (const value of values) {
    parts.push(`  ${keyFor(value)} = "${value}",`);
  }
  parts.push("}", "");
}

writeFileSync(outPath, parts.join("\n") + "\n", "utf8");
console.log(`Generated ${blocks.length} enums -> ${outPath}`);
