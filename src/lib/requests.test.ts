import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack } from "./example-pack.ts";
import { createBlankPack } from "./pack-factory.ts";
import { collectRequests, renderRequestsMarkdown } from "./requests.ts";

test("blank pack has blocking asks for identity and unfinished items", () => {
  const asks = collectRequests(createBlankPack());
  assert.ok(asks.some((a) => a.id === "id:model.artifact_hash" && a.role === "mlops" && a.blocking));
  assert.ok(asks.some((a) => a.id === "id:system_name" && a.role === "ISSM" && a.blocking));
  assert.ok(asks.filter((a) => a.id.endsWith(":pending")).length === 22);
  assert.ok(asks.some((a) => a.blocking));
});

test("sample pack is ready: no identity blockers; SBOM still an MLOps ask", () => {
  const pack = buildExamplePack();
  const asks = collectRequests(pack);
  assert.ok(!asks.some((a) => a.id.startsWith("id:") && a.blocking));
  assert.ok(!asks.some((a) => a.id.endsWith(":pending")));
  assert.ok(asks.some((a) => a.id === "item:INF-SBOM-01:sbom" && a.role === "mlops"));
  const md = renderRequestsMarkdown(pack);
  assert.match(md, /Evidence requests/);
  assert.match(md, /mlops/i);
});
