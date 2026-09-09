#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { hashPack } from "../src/lib/canonical.ts";
import { diffPacks, renderDiffMarkdown } from "../src/lib/diff-pack.ts";
import { parsePackJson } from "../src/lib/parse-pack.ts";
import { readPackJsonFromZip } from "../src/lib/unzip.ts";

function loadPack(path) {
  const buf = new Uint8Array(readFileSync(path));
  const text =
    path.endsWith(".zip") ? readPackJsonFromZip(buf) : new TextDecoder().decode(buf);
  const parsed = parsePackJson(text);
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }
  return parsed.pack;
}

const [cmd, a, b] = process.argv.slice(2);

if (cmd === "hash" && a) {
  const pack = loadPack(a);
  const digest = await hashPack(pack);
  console.log(digest);
} else if (cmd === "diff" && a && b) {
  const prior = loadPack(a);
  const next = loadPack(b);
  const diff = await diffPacks(prior, next);
  process.stdout.write(renderDiffMarkdown(diff));
  if (diff.chain_ok === false) process.exit(2);
} else {
  console.error(`Assess-Only pack CLI
  node --experimental-strip-types --import ./scripts/ts-resolve.mjs bin/ao-pack.mjs hash <pack.json|zip>
  node --experimental-strip-types --import ./scripts/ts-resolve.mjs bin/ao-pack.mjs diff <prior> <next>
`);
  process.exit(1);
}
