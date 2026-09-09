import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack, buildExamplePriorPack } from "./example-pack.ts";
import { sealChain } from "./pack-factory.ts";
import { verifyPack } from "./verify-pack.ts";

test("genesis sample verifies", () => {
  const result = verifyPack(buildExamplePriorPack());
  assert.equal(result.ok, true, result.findings.map((f) => f.message).join("; "));
});

test("unsealed successor is an error", () => {
  const next = buildExamplePack();
  const result = verifyPack(next);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((f) => f.code === "CHAIN_UNSEALED"));
});

test("sealed successor verifies", async () => {
  const prior = buildExamplePriorPack();
  const next = await sealChain(buildExamplePack(), prior);
  const result = verifyPack(next);
  assert.equal(result.ok, true, result.findings.map((f) => f.message).join("; "));
});

test("private key in notes fails", () => {
  const pack = buildExamplePriorPack();
  pack.appendix_b_items[0]!.notes = "-----BEGIN PRIVATE KEY-----\nMIIB";
  const result = verifyPack(pack);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((f) => f.code === "PEM_KEY"));
});

test("weight filename fails", () => {
  const pack = buildExamplePriorPack();
  pack.files.push({
    id: "bad",
    filename: "model.safetensors",
    mime: "application/octet-stream",
    size_bytes: 12,
    data_base64: "",
  });
  const result = verifyPack(pack);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((f) => f.code === "WEIGHTS"));
});
