import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPack } from "./canonical.ts";
import { diffPacks, renderDiffMarkdown } from "./diff-pack.ts";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { sealChain } from "./pack-factory.ts";
import { collectZipEntries } from "./export.ts";
import { unzipStore } from "./unzip.ts";
import { buildZip } from "./zip.ts";

test("diff reports version bump and checklist status changes", async () => {
  const prior = buildExamplePriorPack();
  let next = buildExamplePack();
  next = await sealChain(next, prior);
  const diff = await diffPacks(prior, next);
  assert.equal(diff.chain_ok, true);
  assert.ok(diff.lines.some((l) => l.section === "model" && l.change.includes("version")));
  const md = renderDiffMarkdown(diff);
  assert.match(md, /Chain valid/);
  assert.match(md, /YES/);
});

test("broken chain is flagged", async () => {
  const prior = buildExamplePriorPack();
  const next = buildExamplePack();
  next.chain = { prior_pack_id: prior.pack_id, prior_pack_hash: "sha256:" + "0".repeat(64) };
  const diff = await diffPacks(prior, next);
  assert.equal(diff.chain_ok, false);
});

test("STORE zip round-trips pack.json", async () => {
  const pack = buildExamplePriorPack();
  const blob = buildZip(collectZipEntries(pack));
  const buf = new Uint8Array(await blob.arrayBuffer());
  const files = unzipStore(buf);
  assert.ok(files.has("pack.json"));
  const parsed = JSON.parse(new TextDecoder().decode(files.get("pack.json")));
  assert.equal(parsed.pack_id, pack.pack_id);
  const digest = await hashPack(pack);
  assert.match(digest, /^sha256:/);
});
