import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack, buildExamplePriorPack, hydrateExampleFiles } from "./example-pack.ts";
import { buildPackZipBytes } from "./export.ts";
import { sealChain } from "./pack-factory.ts";
import { unzipStore } from "./unzip.ts";
import { verifyArtifact, verifyPack } from "./verify-pack.ts";

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

test("emitted zip verifies including pack.sha256", async () => {
  const pack = hydrateExampleFiles(buildExamplePriorPack());
  const bytes = await buildPackZipBytes(pack);
  const zip = unzipStore(bytes);
  const raw = JSON.parse(new TextDecoder().decode(zip.get("pack.json")));
  const result = await verifyArtifact({ path: "memory.zip", pack, raw, zip });
  assert.equal(result.ok, true, result.findings.map((f) => `${f.code}: ${f.message}`).join("; "));
});

test("conformance fixtures fail as documented", async () => {
  const { loadPackArtifact } = await import("./load-pack.ts");
  const extra = loadPackArtifact("examples/conformance/extra-field.json");
  const extraResult = await verifyArtifact(extra);
  assert.equal(extraResult.ok, false);
  assert.ok(extraResult.findings.some((f) => f.code === "SCHEMA"));

  const banned = loadPackArtifact("examples/conformance/banned-marking.json");
  const bannedResult = await verifyArtifact(banned);
  assert.equal(bannedResult.ok, false);
  assert.ok(bannedResult.findings.some((f) => f.code === "MARKING_BANNED"));

  const unsealed = loadPackArtifact("examples/conformance/unsealed.json");
  const unsealedResult = await verifyArtifact(unsealed);
  assert.equal(unsealedResult.ok, false);
  assert.ok(unsealedResult.findings.some((f) => f.code === "CHAIN_UNSEALED"));

  const pem = loadPackArtifact("examples/conformance/pem-in-notes.json");
  const pemResult = await verifyArtifact(pem);
  assert.equal(pemResult.ok, false);
  assert.ok(pemResult.findings.some((f) => f.code === "PEM_KEY"));

  const weights = loadPackArtifact("examples/conformance/weights-filename.json");
  const weightsResult = await verifyArtifact(weights);
  assert.equal(weightsResult.ok, false);
  assert.ok(weightsResult.findings.some((f) => f.code === "WEIGHTS"));
});

test("tampered pack.sha256 fails verify", async () => {
  const pack = hydrateExampleFiles(buildExamplePriorPack());
  const bytes = await buildPackZipBytes(pack);
  const zip = unzipStore(bytes);
  zip.set("pack.sha256", new TextEncoder().encode("sha256:0000000000000000000000000000000000000000000000000000000000000000\n"));
  const raw = JSON.parse(new TextDecoder().decode(zip.get("pack.json")));
  const result = await verifyArtifact({ path: "tamper.zip", pack, raw, zip });
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((f) => f.code === "HASH_MISMATCH"));
});

test("tampered evidence bytes fail evidence.sha256", async () => {
  const pack = hydrateExampleFiles(buildExamplePriorPack());
  const bytes = await buildPackZipBytes(pack);
  const zip = unzipStore(bytes);
  const ev = [...zip.keys()].find((k) => k.startsWith("evidence/"));
  assert.ok(ev);
  zip.set(ev, new TextEncoder().encode("tampered\n"));
  const raw = JSON.parse(new TextDecoder().decode(zip.get("pack.json")));
  const result = await verifyArtifact({ path: "tamper-ev.zip", pack, raw, zip });
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((f) => f.code === "EVIDENCE_HASH"));
});
