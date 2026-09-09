import { hashPack } from "./canonical";
import { completeness } from "./completeness";
import type { PackArtifact } from "./load-pack";
import { renderVerify, verifyArtifact } from "./verify-pack";

/** One-screen AO/operator inspect: identity, hash, completeness, verify, zip layout. */
export async function renderInspect(artifact: PackArtifact): Promise<string> {
  const digest = await hashPack(artifact.pack);
  const c = completeness(artifact.pack);
  const verify = await verifyArtifact(artifact);
  const layout = artifact.zip
    ? [...artifact.zip.keys()]
        .sort()
        .map((n) => `- ${n}`)
        .join("\n")
    : "_JSON (not a zip)_";

  return [
    `# Inspect`,
    ``,
    `| | |`,
    `| Path | \`${artifact.path}\` |`,
    `| Pack | \`${artifact.pack.pack_id}\` r${artifact.pack.revision} |`,
    `| Schema | ${artifact.pack.schema_version} |`,
    `| Model | ${artifact.pack.model.name || "—"} ${artifact.pack.model.prior_version || "?"} → ${artifact.pack.model.version || "?"} |`,
    `| Canonical hash | \`${digest}\` |`,
    `| Completeness | ${c.score}% (${c.items_assessed}/${c.items_total} assessed) |`,
    `| Export-ready | ${c.export_ready ? "yes" : "no"} |`,
    `| Source | ${artifact.zip ? "zip" : "json"} |`,
    `| Prior | ${artifact.pack.chain.prior_pack_id ?? "genesis"} |`,
    ``,
    `## Verify`,
    ``,
    renderVerify(verify).trimEnd(),
    ``,
    ``,
    `## Zip layout`,
    ``,
    layout,
    ``,
  ].join("\n");
}
