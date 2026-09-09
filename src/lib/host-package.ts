import { CHECKLIST } from "./checklist";
import { collectPoamRows } from "./poam";
import { statusBoard } from "./status-board";
import type { EvidencePack } from "./types";

/** Where this zip goes in the host A&A package. Not an ATO. */
export function renderHostPackageMarkdown(pack: EvidencePack): string {
  const board = statusBoard(pack);
  const poam = collectPoamRows(pack);
  const infra = CHECKLIST.filter((d) => d.layer === "infra")
    .map((d) => `- \`${d.req_id}\` ${d.title} — indicative ${d.controls.join(", ") || "—"}`)
    .join("\n");
  const model = CHECKLIST.filter((d) => d.layer === "model")
    .map((d) => `- \`${d.req_id}\` ${d.title} — indicative ${d.controls.join(", ") || "—"}`)
    .join("\n");

  return [
    `# Host-package drop-in`,
    ``,
    `**UNCLASSIFIED. This zip is not an Authorization to Operate.** The hosting platform holds the ATO. This pack is Assess-Only evidence for one model lifecycle event. Attach it as supporting evidence to the **host** authorization package.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Host | ${pack.system_context.system_name || "—"} |`,
    `| Host ATO ref | ${pack.system_context.ato_id_or_ref || "—"} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Artifact | \`${pack.model.artifact_hash || "—"}\` |`,
    `| Event | ${pack.event.type} |`,
    `| Prior pack | ${pack.chain.prior_pack_id ?? "genesis"} |`,
    `| Inherited items | ${board.inherited.length} |`,
    `| This-event items | ${board.this_event.length} |`,
    `| POA&M rows | ${poam.length} |`,
    `| AO decision in pack | ${pack.residual_risk.ao_decision} |`,
    ``,
    `## What to do with this zip`,
    ``,
    `1. Do **not** open a new ATO for the model.`,
    `2. Upload the zip as supporting evidence under the host record in eMASS (or the Component equivalent).`,
    `3. Point the AO determination brief at \`status.md\`, \`brief.md\`, \`sar.md\`, \`poam.md\`, and this page.`,
    `4. Transcribe \`poam.csv\` into the host POA&M if Component process requires eMASS rows.`,
    `5. Treat INF-* as host-layer / common-control themes. Treat MDL-* as this event.`,
    ``,
    `## Infrastructure layer (host themes)`,
    ``,
    infra,
    ``,
    `## AI model layer (this event)`,
    ``,
    model,
    ``,
    `## Inherited vs this event`,
    ``,
    board.inherited.length
      ? board.inherited.map((i) => `- Inherited \`${i.req_id}\` from \`${i.inherited_from}\``).join("\n")
      : "_Nothing stamped inherited. If this is a bump, re-export from a pack created with **Bump from this pack**._",
    ``,
    `Indicative control IDs are overlay themes, not a claim those 800-53 controls were assessed in eMASS.`,
    ``,
  ].join("\n");
}
