import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";
import { collectSarRows, renderControlsCsv, renderSarMarkdown } from "./sar.ts";

test("SAR has 22 rows; blank pack findings are not assessed", () => {
  const rows = collectSarRows(createBlankPack());
  assert.equal(rows.length, 22);
  assert.ok(rows.every((r) => r.status === "pending"));
  assert.match(renderSarMarkdown(createBlankPack()), /Not assessed this event/);
});

test("sample SAR mixes satisfied and POA&M recommendations", () => {
  const rows = collectSarRows(buildExamplePack());
  assert.ok(rows.some((r) => r.status === "met" && r.recommendation === "None."));
  assert.ok(rows.some((r) => r.status === "gap" && /POA&M/.test(r.recommendation)));
  const md = renderSarMarkdown(buildExamplePack());
  assert.match(md, /Security Assessment Report/);
  assert.match(md, /INF-BND-01/);
  const csv = renderControlsCsv();
  assert.match(csv, /^req_id,layer,title/);
  assert.match(csv, /INF-BND-01/);
  assert.equal(csv.trim().split("\n").length, 23);
});
