import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalJson, hashPack } from "./canonical.ts";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";

test("canonical json is stable for the same pack", () => {
  const pack = buildExamplePriorPack();
  pack.created_at = "2026-01-01T00:00:00.000Z";
  pack.updated_at = pack.created_at;
  assert.equal(canonicalJson(pack), canonicalJson(structuredClone(pack)));
});

test("hash is sha256 prefixed and 64 hex chars", async () => {
  const pack = buildExamplePriorPack();
  pack.created_at = "2026-01-01T00:00:00.000Z";
  pack.updated_at = pack.created_at;
  const a = await hashPack(pack);
  const b = await hashPack(pack);
  assert.equal(a, b);
  assert.match(a, /^sha256:[a-f0-9]{64}$/);
});

test("published sample hashes stay stable", async () => {
  const { loadPackFromPath } = await import("./load-pack.ts");
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
});

test("inline file bytes do not change the pack hash", async () => {
  const pack = buildExamplePack();
  pack.created_at = "2026-01-01T00:00:00.000Z";
  pack.updated_at = pack.created_at;
  const before = await hashPack(pack);
  pack.files[0]!.data_base64 = "dGVzdA==";
  const after = await hashPack(pack);
  assert.equal(before, after);
});
