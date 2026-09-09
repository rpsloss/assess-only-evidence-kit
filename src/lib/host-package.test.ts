import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExamplePack } from "./example-pack.ts";
import { renderHostPackageMarkdown } from "./host-package.ts";

test("host package page says this is not an ATO", () => {
  const md = renderHostPackageMarkdown(buildExamplePack());
  assert.match(md, /not an Authorization to Operate/i);
  assert.match(md, /Host-package drop-in/);
  assert.match(md, /supporting evidence/);
  assert.match(md, /INF-BND-01/);
  assert.match(md, /MDL-/);
  assert.match(md, /poam.csv/);
});
