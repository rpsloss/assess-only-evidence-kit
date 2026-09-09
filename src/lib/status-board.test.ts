import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";
import { classifyItem, renderStatusMarkdown, statusBoard } from "./status-board.ts";

test("met without evidence is sub-par, not present", () => {
  assert.equal(classifyItem("met", true).bucket, "present");
  assert.equal(classifyItem("met", false).bucket, "subpar");
  assert.equal(classifyItem("partial", true).bucket, "subpar");
  assert.equal(classifyItem("gap", true).bucket, "gapped");
  assert.equal(classifyItem("pending", false).bucket, "unfinished");
  assert.equal(classifyItem("na", false).bucket, "present");
});

test("blank pack is entirely unfinished and not export-ready", () => {
  const board = statusBoard(createBlankPack());
  assert.equal(board.counts.unfinished, 22);
  assert.equal(board.export_ready, false);
  assert.ok(board.gates.some((g) => g.id === "identity" && !g.ok && g.blocking));
});

test("sample pack has mixed buckets and is export-ready", () => {
  const board = statusBoard(buildExamplePack());
  assert.equal(board.counts.total, 22);
  assert.ok(board.counts.present >= 10);
  assert.ok(board.counts.gapped >= 1);
  assert.ok(board.counts.subpar >= 1);
  assert.equal(board.counts.unfinished, 0);
  assert.equal(board.export_ready, true);
  const md = renderStatusMarkdown(buildExamplePriorPack());
  assert.match(md, /Assess-Only status board/);
  assert.match(md, /INF-BND-01/);
  assert.match(md, /MDL-/);
});
