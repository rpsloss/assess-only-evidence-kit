import assert from "node:assert/strict";
import { test } from "node:test";
import { CHECKLIST, itemsForLayer } from "./checklist.ts";
import { completeness } from "./completeness.ts";
import { buildExamplePack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";

test("checklist is 10 infra + 12 model", () => {
  assert.equal(CHECKLIST.length, 22);
  assert.equal(itemsForLayer("infra").length, 10);
  assert.equal(itemsForLayer("model").length, 12);
});

test("blank pack is not export-ready", () => {
  const c = completeness(createBlankPack());
  assert.equal(c.identity_ok, false);
  assert.equal(c.items_pending, 22);
  assert.equal(c.export_ready, false);
  assert.ok(c.score < 20);
});

test("sample pack has mixed statuses and is export-ready", () => {
  const pack = buildExamplePack();
  const c = completeness(pack);
  assert.equal(c.identity_ok, true);
  assert.ok(c.items_met >= 10);
  assert.ok(c.items_gap >= 1);
  assert.equal(c.export_ready, true);
  assert.ok(c.score > 50);
});
