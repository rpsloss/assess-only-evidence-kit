import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePriorPack } from "./example-pack.ts";
import { bumpFromBaseline } from "./pack-factory.ts";
import { hashPack } from "./canonical.ts";
import { loadPackFromPath } from "./load-pack.ts";
import { statusBoard } from "./status-board.ts";

test("bump stamps inherited_from on infra and re-opens model items", () => {
  const prior = buildExamplePriorPack();
  const next = bumpFromBaseline(prior);
  const infra = next.appendix_b_items.filter((i) => i.req_id.startsWith("INF-"));
  const model = next.appendix_b_items.filter((i) => i.req_id.startsWith("MDL-"));
  assert.equal(infra.length, 10);
  assert.equal(model.length, 12);
  assert.ok(infra.every((i) => i.inherited_from === prior.pack_id));
  assert.ok(model.every((i) => i.inherited_from === undefined));
  assert.ok(model.every((i) => i.status === "pending"));
  const board = statusBoard(next);
  assert.equal(board.inherited.length, 10);
  assert.equal(board.this_event.length, 12);
});

test("published samples still have no inherited_from (hash pin)", async () => {
  const prior = loadPackFromPath("examples/model-bump-v1/prior-1.2.0.pack.json");
  const next = loadPackFromPath("examples/model-bump-v1/pack.json");
  assert.ok(prior.appendix_b_items.every((i) => i.inherited_from === undefined));
  assert.ok(next.appendix_b_items.every((i) => i.inherited_from === undefined));
  assert.equal(
    await hashPack(prior),
    "sha256:f85561b3373b60d1330f6dce6f693947fd5ff38db5e15529ef76728456f6920c",
  );
  assert.equal(
    await hashPack(next),
    "sha256:c86628510825f2764ddcbe0fe9ed8be66e7f3f9ad7932471d9c0a1ee7ccb83ad",
  );
});
