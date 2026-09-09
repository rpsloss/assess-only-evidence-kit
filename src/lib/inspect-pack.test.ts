import assert from "node:assert/strict";
import { test } from "node:test";
import { renderInspect } from "./inspect-pack.ts";
import { loadPackArtifact } from "./load-pack.ts";

test("inspect of sample successor includes hash and completeness", async () => {
  const artifact = loadPackArtifact("examples/model-bump-v1/pack.json");
  const text = await renderInspect(artifact);
  assert.match(text, /pck_sample_doc_route_clf_130/);
  assert.match(text, /sha256:[a-f0-9]{64}/);
  assert.match(text, /Export-ready \| yes/);
  assert.match(text, /VERIFY OK/);
});
