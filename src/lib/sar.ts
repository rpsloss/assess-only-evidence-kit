import { CHECKLIST } from "./checklist";
import { itemById, layerLabel, statusLabel } from "./completeness";
import type { EvidencePack, ItemStatus, Layer } from "./types";

export type SarRow = {
  req_id: string;
  layer: Layer;
  title: string;
  status: ItemStatus;
  method: string;
  finding: string;
  recommendation: string;
  evidence: string;
  controls: string[];
};

function findingFor(status: ItemStatus, notes: string): string {
  const note = notes.trim();
  switch (status) {
    case "pending":
      return "Not assessed this event.";
    case "met":
      return note || "Satisfied as documented.";
    case "partial":
      return note || "Partially satisfied; residual work remains.";
    case "gap":
      return note || "Not satisfied. See POA&M.";
    case "na":
      return note || "Not applicable as documented.";
  }
}

function recommendationFor(status: ItemStatus): string {
  switch (status) {
    case "pending":
      return "Assess before the AO/SCA brief.";
    case "met":
      return "None.";
    case "partial":
      return "Complete residual work or accept in the host POA&M.";
    case "gap":
      return "Track in the host POA&M.";
    case "na":
      return "None.";
  }
}

export function collectSarRows(pack: EvidencePack): SarRow[] {
  return CHECKLIST.map((def) => {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    const evidence = (state?.evidence_refs ?? [])
      .map((r) => r.value.trim())
      .filter(Boolean)
      .join("; ");
    return {
      req_id: def.req_id,
      layer: def.layer,
      title: def.title,
      status,
      method: "Examine notes and URI pointers (Assess-Only overlay theme).",
      finding: findingFor(status, state?.notes ?? ""),
      recommendation: recommendationFor(status),
      evidence,
      controls: def.controls,
    };
  });
}

export function renderSarMarkdown(pack: EvidencePack): string {
  const rows = collectSarRows(pack);
  const open = rows.filter((r) => r.status === "partial" || r.status === "gap" || r.status === "pending");
  return [
    `# Security Assessment Report (draft)`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.** Draft findings for the host SCA to transcribe. Not an eMASS SAR write.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Host ATO ref | ${pack.system_context.ato_id_or_ref || "—"} |`,
    `| Items | ${rows.length} |`,
    `| Open (pending / partial / gap) | ${open.length} |`,
    ``,
    `| ID | Layer | Status | Finding | Recommendation |`,
    `| --- | --- | --- | --- | --- |`,
    ...rows.map(
      (r) =>
        `| ${r.req_id} | ${layerLabel(r.layer)} | ${statusLabel(r.status)} | ${r.finding.replace(/\|/g, "/")} | ${r.recommendation.replace(/\|/g, "/")} |`,
    ),
    ``,
    `## Detail`,
    ``,
    ...rows.flatMap((r) => [
      `### ${r.req_id} — ${r.title}`,
      ``,
      `- **Method:** ${r.method}`,
      `- **Finding:** ${r.finding}`,
      `- **Recommendation:** ${r.recommendation}`,
      `- **Evidence:** ${r.evidence || "—"}`,
      `- **Indicative controls:** ${r.controls.join(", ") || "—"}`,
      ``,
    ]),
    `The SCA-validator owns the host SAR in eMASS. This file is a draft they can copy.`,
    ``,
  ].join("\n");
}

export function renderControlsCsv(): string {
  const header = "req_id,layer,title,controls,nist_ai_rmf,appendix_ref";
  const lines = CHECKLIST.map((d) => {
    const cells = [
      d.req_id,
      d.layer,
      d.title,
      d.controls.join(" "),
      d.nist_ai_rmf.join(" "),
      d.appendix_ref,
    ].map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c));
    return cells.join(",");
  });
  return `${[header, ...lines].join("\n")}\n`;
}
