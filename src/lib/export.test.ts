import assert from "node:assert/strict";
import { test } from "node:test";
import { collectZipEntries, exportFilename } from "./export.ts";
import { hydrateExampleFiles, buildExamplePack } from "./example-pack.ts";

test("zip contains required AO artifacts", () => {
  const pack = hydrateExampleFiles(buildExamplePack());
  const names = collectZipEntries(pack).map((e) => e.name).sort();
  assert.ok(names.includes("pack.md"));
  assert.ok(names.includes("pack.json"));
  assert.ok(names.includes("gap_report.md"));
  assert.ok(names.includes("README.txt"));
  assert.ok(names.includes("schema/evidence-pack.schema.json"));
  assert.ok(names.includes("evidence/hash-manifest.txt"));
  assert.ok(names.includes("evidence/eval-holdout-v13.txt"));
  assert.match(exportFilename(pack), /doc-route-clf/);
});
