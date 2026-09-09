import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPack } from "./canonical.ts";
import { collectPackZipEntries, collectZipEntries, exportFilename } from "./export.ts";
import { hydrateExampleFiles, buildExamplePack } from "./example-pack.ts";
import { unzipStore } from "./unzip.ts";
import { buildPackZipBytes } from "./export.ts";

test("zip contains required AO artifacts", () => {
  const pack = hydrateExampleFiles(buildExamplePack());
  const names = collectZipEntries(pack).map((e) => e.name).sort();
  assert.ok(names.includes("pack.md"));
  assert.ok(names.includes("brief.md"));
  assert.ok(names.includes("status.md"));
  assert.ok(names.includes("pack.json"));
  assert.ok(names.includes("gap_report.md"));
  assert.ok(names.includes("README.txt"));
  assert.ok(names.includes("schema/evidence-pack.schema.json"));
  assert.ok(names.includes("evidence/hash-manifest.txt"));
  assert.ok(names.includes("evidence/eval-holdout-v13.txt"));
  assert.match(exportFilename(pack), /doc-route-clf/);
});

test("sealed zip pack.sha256 matches canonical hash", async () => {
  const pack = hydrateExampleFiles(buildExamplePack());
  const entries = await collectPackZipEntries(pack);
  const names = entries.map((e) => e.name);
  assert.ok(names.includes("pack.sha256"));
  assert.ok(names.includes("evidence.sha256"));
  const digest = new TextDecoder().decode(entries.find((e) => e.name === "pack.sha256")!.data).trim();
  assert.equal(digest, await hashPack(pack));
});

test("STORE zip round-trips pack.json and sidecars", async () => {
  const pack = hydrateExampleFiles(buildExamplePack());
  const bytes = await buildPackZipBytes(pack);
  const files = unzipStore(bytes);
  assert.ok(files.has("pack.json"));
  assert.ok(files.has("brief.md"));
  assert.ok(files.has("pack.sha256"));
  assert.ok(files.has("evidence.sha256"));
  const digest = new TextDecoder().decode(files.get("pack.sha256")).trim();
  assert.equal(digest, await hashPack(pack));
});
