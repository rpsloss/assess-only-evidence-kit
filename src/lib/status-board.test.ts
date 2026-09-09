import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";
import { classifyItem, renderStatusMarkdown, statusBoard } from "./status-board.ts";

test("buckets follow stored status; met without evidence stays present", () => {
  assert.equal(classifyItem("met", true).bucket, "present");
  assert.equal(classifyItem("met", false).bucket, "present");
  assert.equal(classifyItem("partial", true).bucket, "partial");
  assert.equal(classifyItem("partial", false).bucket, "partial");
  assert.equal(classifyItem("gap", true).bucket, "gapped");
  assert.equal(classifyItem("pending", false).bucket, "unfinished");
  assert.equal(classifyItem("na", false).bucket, "present");
});

test("blank pack is entirely unfinished and not ready for AO/SCA", () => {
  const board = statusBoard(createBlankPack());
  assert.equal(board.counts.unfinished, 22);
  assert.equal(board.counts.partial, 0);
  assert.equal(board.export_ready, false);
  assert.ok(board.gates.some((g) => g.id === "identity" && !g.ok && g.blocking));
});

test("sample pack has mixed buckets and is ready for AO/SCA", () => {
  const board = statusBoard(buildExamplePack());
  assert.equal(board.counts.total, 22);
  assert.ok(board.counts.present >= 10);
  assert.ok(board.counts.gapped >= 1);
  assert.ok(board.counts.partial >= 1);
  assert.equal(board.counts.unfinished, 0);
  assert.equal(board.export_ready, true);
  const md = renderStatusMarkdown(buildExamplePriorPack());
  assert.match(md, /Assess-Only status board/);
  assert.match(md, /Partial/);
  assert.doesNotMatch(md, /Sub-par/);
  assert.match(md, /INF-BND-01/);
  assert.match(md, /MDL-/);
});
