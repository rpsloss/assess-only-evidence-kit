import assert from "node:assert/strict";
import { test } from "node:test";
import { renderBrief } from "./brief-pack.ts";
import { walkChain } from "./chain-pack.ts";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { sealChain } from "./pack-factory.ts";

test("walkChain accepts sealed 1.2 → 1.3", async () => {
  const prior = buildExamplePriorPack();
  const next = await sealChain(buildExamplePack(), prior);
  const result = await walkChain([prior, next]);
  assert.equal(result.ok, true);
  assert.equal(result.steps[1]?.chain_ok, true);
});

test("walkChain rejects a broken middle link", async () => {
  const prior = buildExamplePriorPack();
  const next = buildExamplePack();
  next.chain.prior_pack_hash = "sha256:" + "ab".repeat(32);
  const result = await walkChain([prior, next]);
  assert.equal(result.ok, false);
});

test("brief includes host and residual risk", () => {
  const md = renderBrief(buildExamplePriorPack());
  assert.match(md, /Assess-Only brief/);
  assert.match(md, /PLATFORM-ALPHA/);
  assert.match(md, /Residual risk/);
});
