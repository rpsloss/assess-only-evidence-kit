import { CHECKLIST } from "./checklist";
import { itemById, layerLabel, statusLabel } from "./completeness";
import type { EvidencePack, ItemStatus, Layer, PoamEntry, RiskLevel } from "./types";
import { RISK_LEVELS } from "./types";

export type PoamRow = {
  req_id: string;
  title: string;
  layer: Layer;
  status: "partial" | "gap";
  controls: string[];
  weakness: string;
  task: string;
  owner: string;
  resources: string;
  milestone: string;
  scheduled_date: string;
  residual_risk_level: string;
  evidence: string;
};

export function emptyPoam(): PoamEntry {
  return {
    task: "",
    owner: "",
    resources: "",
    milestone: "",
    scheduled_date: "",
    residual_risk_level: "",
  };
}

export function compactPoam(entry: PoamEntry): PoamEntry | undefined {
  const next: PoamEntry = {
    task: entry.task.trim(),
    owner: entry.owner.trim(),
    resources: entry.resources.trim(),
    milestone: entry.milestone.trim(),
    scheduled_date: entry.scheduled_date.trim(),
    residual_risk_level: RISK_LEVELS.includes(entry.residual_risk_level as RiskLevel)
      ? (entry.residual_risk_level as RiskLevel)
      : "",
  };
  if (
    !next.task &&
    !next.owner &&
    !next.resources &&
    !next.milestone &&
    !next.scheduled_date &&
    !next.residual_risk_level
  ) {
    return undefined;
  }
  return next;
}

export function isPoamStatus(status: ItemStatus): status is "partial" | "gap" {
  return status === "partial" || status === "gap";
}

function defaultTask(status: "partial" | "gap"): string {
  return status === "gap"
    ? "Close the gap or accept residual risk in the host POA&M."
    : "Complete residual work noted on this item.";
}

/** One row per partial or gap. Pending is unfinished, not a POA&M weakness. */
export function collectPoamRows(pack: EvidencePack): PoamRow[] {
  const rows: PoamRow[] = [];
  for (const def of CHECKLIST) {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    if (!isPoamStatus(status)) continue;
    const poam = state?.poam;
    const evidence = (state?.evidence_refs ?? [])
      .map((r) => r.value.trim())
      .filter(Boolean)
      .join("; ");
    rows.push({
      req_id: def.req_id,
      title: def.title,
      layer: def.layer,
      status,
      controls: def.controls,
      weakness: (state?.notes ?? "").trim() || def.title,
      task: poam?.task.trim() || defaultTask(status),
      owner: poam?.owner.trim() || pack.author_name.trim() || pack.author_role,
      resources: poam?.resources.trim() || "",
      milestone: poam?.milestone.trim() || "",
      scheduled_date: poam?.scheduled_date.trim() || "",
      residual_risk_level: poam?.residual_risk_level || "",
      evidence,
    });
  }
  return rows;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function renderPoamCsv(pack: EvidencePack): string {
  const header = [
    "req_id",
    "title",
    "layer",
    "status",
    "controls",
    "weakness",
    "task",
    "owner",
    "resources",
    "milestone",
    "scheduled_date",
    "residual_risk_level",
    "evidence",
  ];
  const lines = [header.join(",")];
  for (const row of collectPoamRows(pack)) {
    lines.push(
      [
        row.req_id,
        row.title,
        row.layer,
        row.status,
        row.controls.join(" "),
        row.weakness,
        row.task,
        row.owner,
        row.resources,
        row.milestone,
        row.scheduled_date,
        row.residual_risk_level,
        row.evidence,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function renderPoamMarkdown(pack: EvidencePack): string {
  const rows = collectPoamRows(pack);
  const table =
    rows.length === 0
      ? "_No partial or gap items. No POA&M rows for this event._"
      : [
          `| ID | Layer | Status | Weakness | Task | Owner | Scheduled | Residual |`,
          `| --- | --- | --- | --- | --- | --- | --- | --- |`,
          ...rows.map(
            (r) =>
              `| ${r.req_id} | ${layerLabel(r.layer)} | ${statusLabel(r.status)} | ${r.weakness.replace(/\|/g, "/")} | ${r.task.replace(/\|/g, "/")} | ${r.owner || "—"} | ${r.scheduled_date || "—"} | ${r.residual_risk_level || "—"} |`,
          ),
        ].join("\n");

  const detail = rows.flatMap((r) => [
    `### ${r.req_id} — ${r.title}`,
    ``,
    `- **Status:** ${statusLabel(r.status)} (${r.layer})`,
    `- **Indicative controls:** ${r.controls.join(", ") || "—"}`,
    `- **Weakness:** ${r.weakness}`,
    `- **Task:** ${r.task}`,
    `- **Owner:** ${r.owner || "—"}`,
    `- **Resources:** ${r.resources || "—"}`,
    `- **Milestone:** ${r.milestone || "—"}`,
    `- **Scheduled completion:** ${r.scheduled_date || "—"}`,
    `- **Residual risk level:** ${r.residual_risk_level || "—"}`,
    `- **Evidence:** ${r.evidence || "—"}`,
    ``,
  ]);

  return [
    `# Plan of Action and Milestones`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.** Host holds the authorization. This POA&M is supporting evidence for the host package. It is not an eMASS write.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Host ATO ref | ${pack.system_context.ato_id_or_ref || "—"} |`,
    `| Open rows | ${rows.length} (partial + gap) |`,
    `| Pack residual | ${pack.residual_risk.ao_decision} |`,
    ``,
    `Rows are **partial** (assessed, residual work) and **gap** (explicit hole). Unfinished (pending) items are not POA&M rows — assess them first.`,
    ``,
    `## Summary`,
    ``,
    table,
    ``,
    rows.length ? `## Items` : "",
    ``,
    ...detail,
    `Transcribe into the host eMASS POA&M if Component process requires it. Do not treat this file as authorization.`,
    ``,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
