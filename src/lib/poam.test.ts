import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";
import { hashPack } from "./canonical.ts";
import { collectPoamRows, compactPoam, emptyPoam, renderPoamCsv, renderPoamMarkdown } from "./poam.ts";
import { loadPackFromPath } from "./load-pack.ts";

test("blank pack has no POA&M rows", () => {
  assert.equal(collectPoamRows(createBlankPack()).length, 0);
});

test("sample pack POA&M is partial plus gap only", () => {
  const rows = collectPoamRows(buildExamplePack());
  assert.ok(rows.length >= 3);
  assert.ok(rows.every((r) => r.status === "partial" || r.status === "gap"));
  assert.ok(rows.some((r) => r.status === "partial"));
  assert.ok(rows.some((r) => r.status === "gap"));
  const md = renderPoamMarkdown(buildExamplePriorPack());
  assert.match(md, /Plan of Action and Milestones/);
  assert.match(md, /INF-SBOM-01|MDL-/);
  const csv = renderPoamCsv(buildExamplePack());
  assert.match(csv, /^req_id,/);
  assert.match(csv, /partial|gap/);
});

test("empty poam object is omitted", () => {
  assert.equal(compactPoam(emptyPoam()), undefined);
  assert.equal(compactPoam({ ...emptyPoam(), task: "  " }), undefined);
  assert.equal(compactPoam({ ...emptyPoam(), task: "Write SBOM" })?.task, "Write SBOM");
});

test("optional poam does not change published sample hashes", async () => {
  const prior = loadPackFromPath("examples/model-bump-v1/prior-1.2.0.pack.json");
  const next = loadPackFromPath("examples/model-bump-v1/pack.json");
  assert.equal(
    await hashPack(prior),
    "sha256:f85561b3373b60d1330f6dce6f693947fd5ff38db5e15529ef76728456f6920c",
  );
  assert.equal(
    await hashPack(next),
    "sha256:c86628510825f2764ddcbe0fe9ed8be66e7f3f9ad7932471d9c0a1ee7ccb83ad",
  );
  assert.ok(prior.appendix_b_items.every((i) => i.poam === undefined));
});
