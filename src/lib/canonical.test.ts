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

test("inline file bytes do not change the pack hash", async () => {
  const pack = buildExamplePack();
  pack.created_at = "2026-01-01T00:00:00.000Z";
  pack.updated_at = pack.created_at;
  const before = await hashPack(pack);
  pack.files[0]!.data_base64 = "dGVzdA==";
  const after = await hashPack(pack);
  assert.equal(before, after);
});
