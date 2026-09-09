import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildExamplePriorPack } from "./example-pack.ts";
import { validatePackShape } from "./pack-shape.ts";

test("sample prior pack matches 0.3 shape", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../../examples/model-bump-v1/prior-1.2.0.pack.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(validatePackShape(raw), []);
});

test("sample successor pack matches 0.3 shape", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../../examples/model-bump-v1/pack.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(validatePackShape(raw), []);
});

test("unknown top-level key is a schema error", () => {
  const raw = { ...buildExamplePriorPack(), secret: "nope" };
  const findings = validatePackShape(raw);
  assert.ok(findings.some((f) => f.code === "SCHEMA"));
});

test("missing chain on 0.3.0 is a schema error", () => {
  const pack = buildExamplePriorPack();
  const raw = { ...pack };
  delete (raw as { chain?: unknown }).chain;
  const findings = validatePackShape(raw);
  assert.ok(findings.some((f) => f.message.includes("chain")));
});

test("bad author_role is a schema error", () => {
  const raw = { ...buildExamplePriorPack(), author_role: "hacker" };
  const findings = validatePackShape(raw);
  assert.ok(findings.some((f) => f.message.toLowerCase().includes("author_role") || f.code === "SCHEMA"));
});
