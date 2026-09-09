#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { renderBrief } from "../src/lib/brief-pack.ts";
import { hashPack } from "../src/lib/canonical.ts";
import { walkChain, renderChain } from "../src/lib/chain-pack.ts";
import { diffPacks, renderDiffMarkdown } from "../src/lib/diff-pack.ts";
import { packJson } from "../src/lib/export.ts";
import { loadPackFromPath } from "../src/lib/load-pack.ts";
import { sealChain } from "../src/lib/pack-factory.ts";
import { renderVerify, verifyPack } from "../src/lib/verify-pack.ts";

function usage() {
  console.error(`Assess-Only pack CLI
  npm run ao-pack -- hash <pack.json|zip>
  npm run ao-pack -- verify <pack.json|zip>
  npm run ao-pack -- brief <pack.json|zip> [prior.json|zip]
  npm run ao-pack -- seal <prior> <next> [-o out.json]
  npm run ao-pack -- diff <prior> <next>
  npm run ao-pack -- chain <p1> <p2> [p3...]
`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === "hash" && args[1]) {
  console.log(await hashPack(loadPackFromPath(args[1])));
} else if (cmd === "verify" && args[1]) {
  const result = verifyPack(loadPackFromPath(args[1]));
  process.stdout.write(renderVerify(result));
  if (!result.ok) process.exit(1);
} else if (cmd === "brief" && args[1]) {
  const pack = loadPackFromPath(args[1]);
  const prior = args[2] ? loadPackFromPath(args[2]) : null;
  const diff = prior ? await diffPacks(prior, pack) : null;
  process.stdout.write(renderBrief(pack, diff));
} else if (cmd === "seal" && args[1] && args[2]) {
  const prior = loadPackFromPath(args[1]);
  const next = loadPackFromPath(args[2]);
  const sealed = await sealChain(next, prior);
  const outIdx = args.indexOf("-o");
  const dest = outIdx >= 0 ? args[outIdx + 1] : args[2];
  writeFileSync(dest, packJson(sealed));
  console.error(`sealed ${sealed.pack_id} → ${dest}`);
  console.log(sealed.chain.prior_pack_hash);
} else if (cmd === "diff" && args[1] && args[2]) {
  const diff = await diffPacks(loadPackFromPath(args[1]), loadPackFromPath(args[2]));
  process.stdout.write(renderDiffMarkdown(diff));
  if (diff.chain_ok === false) process.exit(2);
} else if (cmd === "chain" && args.length >= 3) {
  const packs = args.slice(1).map((p) => loadPackFromPath(p));
  const result = await walkChain(packs);
  process.stdout.write(renderChain(result));
  if (!result.ok) process.exit(2);
} else {
  usage();
  process.exit(1);
}
