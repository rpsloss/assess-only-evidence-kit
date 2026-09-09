import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePackJson } from "./parse-pack.ts";
import { SCHEMA_VERSION } from "./types.ts";

test("rejects non-json", () => {
  const result = parsePackJson("{");
  assert.equal(result.ok, false);
});

test("fills missing checklist rows on import", () => {
  const result = parsePackJson({
    schema_version: SCHEMA_VERSION,
    pack_id: "pck_import_test",
    system_context: { system_name: "Host", ato_id_or_ref: "ATO-1", boundary_notes: "b" },
    model: { name: "m", version: "1", artifact_hash: "abc" },
    event: { type: "model_version_bump", rationale: "r" },
    appendix_b_items: [{ req_id: "INF-BND-01", status: "met", notes: "ok" }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.pack.appendix_b_items.length, 22);
  assert.equal(result.pack.appendix_b_items[0]?.status, "met");
  assert.equal(result.pack.model.name, "m");
});

test("migrates 0.2 baseline_pack_id into chain", () => {
  const result = parsePackJson({
    schema_version: "0.2.0",
    pack_id: "pck_old",
    baseline_pack_id: "pck_older",
    system_context: { system_name: "Host", ato_id_or_ref: "ATO-1", boundary_notes: "b" },
    model: { name: "m", version: "1", artifact_hash: "abc" },
    event: { type: "model_version_bump", rationale: "r" },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.pack.schema_version, "0.3.0");
  assert.equal(result.pack.chain.prior_pack_id, "pck_older");
  assert.equal(result.pack.chain.prior_pack_hash, null);
});
