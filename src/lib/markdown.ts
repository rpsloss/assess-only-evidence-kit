import { CHECKLIST } from "./checklist";
import { completeness, defFor, layerLabel, statusLabel } from "./completeness";
import type { EvidencePack } from "./types";

function line(text: string): string {
  return text.replace(/\s+$/g, "");
}

export function renderReadmeTxt(pack: EvidencePack): string {
  return [
    "ASSESS-ONLY EVIDENCE PACK",
    "This zip is not an Authorization to Operate.",
    "The hosting platform holds the ATO. The model is incorporated via RMF Assess Only.",
    "",
    `Marking: ${pack.marking}`,
    `Pack: ${pack.pack_id} revision ${pack.revision}`,
    `System: ${pack.system_context.system_name || "(blank)"}`,
    `ATO ref: ${pack.system_context.ato_id_or_ref || "(blank)"}`,
    `Model: ${pack.model.name || "(blank)"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"}`,
    "",
    "Contents:",
    "  pack.md            AO-facing narrative",
    "  pack.json          machine record (schema 0.3.0)",
    "  pack.sha256        canonical hash of pack.json",
    "  gap_report.md      unmet / pending / partial items",
    "  schema/            evidence-pack.schema.json",
    "  evidence/          optional attachments (prefer URI pointers)",
    "",
    "Do not place API keys, weights, or CUI in a pack.",
    "",
  ].join("\n");
}

export function renderPackMarkdown(pack: EvidencePack): string {
  const c = completeness(pack);
  const rows = CHECKLIST.map((def) => {
    const state = pack.appendix_b_items.find((i) => i.req_id === def.req_id);
    const status = statusLabel(state?.status ?? "pending");
    const refs = (state?.evidence_refs ?? [])
      .filter((r) => r.value.trim())
      .map((r) => r.value)
      .join("; ");
    return `| ${def.req_id} | ${def.title} | ${status} | ${refs || "—"} |`;
  });
  const evals = pack.evaluations.length
    ? pack.evaluations
        .map((ev) => {
          const metrics = Object.entries(ev.metrics)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
          const pass = ev.passed === null ? "n/a" : ev.passed ? "pass" : "fail";
          return `- **${ev.name || "(unnamed)"}** (${pass}) dataset \`${ev.dataset_ref || "—"}\` ${metrics} ${ev.raw_artifact_uri}`.trim();
        })
        .join("\n")
    : "_No evaluations recorded._";
  const perf = pack.thresholds.performance
    .filter((t) => t.metric.trim())
    .map((t) => `- ${t.metric} ${t.operator} ${t.value} ${t.unit}`.trim())
    .join("\n");
  const drift = pack.thresholds.drift
    .filter((t) => t.metric.trim())
    .map((t) => `- ${t.metric} ${t.operator} ${t.value} (${t.method})`)
    .join("\n");

  return [
    `# Assess-Only Evidence Pack`,
    ``,
    `**Marking:** ${pack.marking}`,
    `**This document is not an ATO.** The hosting platform holds the authorization. The model is technology below the system level and is incorporated via RMF Assess Only.`,
    ``,
    `| Field | Value |`,
    `| --- | --- |`,
    `| Pack ID | ${pack.pack_id} |`,
    `| Revision | ${pack.revision} |`,
    `| Created | ${pack.created_at} |`,
    `| Updated | ${pack.updated_at} |`,
    `| Author | ${pack.author_name || "—"} (${pack.author_role}) |`,
    `| Completeness | ${c.score}% (${c.items_assessed}/${c.items_total} items assessed) |`,
    `| Export-ready | ${c.export_ready ? "yes" : "no"} |`,
    ``,
    `## 1. Host system`,
    ``,
    `- **System:** ${pack.system_context.system_name || "_blank_"}`,
    `- **ATO reference:** ${pack.system_context.ato_id_or_ref || "_blank_"}`,
    `- **Boundary:** ${pack.system_context.boundary_notes || "_blank_"}`,
    `- **Environment:** ${pack.system_context.environment_notes || "_blank_"}`,
    ``,
    `## 2. Model`,
    ``,
    `- **Name:** ${pack.model.name || "_blank_"}`,
    `- **Task:** ${pack.model.task}`,
    `- **Prior → new:** ${pack.model.prior_version || "?"} → ${pack.model.version || "?"}`,
    `- **Hash (${pack.model.hash_alg}):** \`${pack.model.artifact_hash || "blank"}\``,
    `- **Catalog:** ${pack.model.catalog_uri || "_blank_"}`,
    `- **Provenance:** ${pack.model.training_data_provenance_ref || "_blank_"}`,
    ``,
    `## 3. Event`,
    ``,
    `- **Type:** ${pack.event.type}`,
    `- **Rationale:** ${pack.event.rationale || "_blank_"}`,
    `- **Change summary:** ${pack.event.change_summary || "_blank_"}`,
    pack.chain?.prior_pack_id
      ? `- **Prior pack:** ${pack.chain.prior_pack_id}`
      : pack.baseline_pack_id
        ? `- **Baseline pack:** ${pack.baseline_pack_id}`
        : "",
    pack.chain?.prior_pack_hash ? `- **Prior pack hash:** \`${pack.chain.prior_pack_hash}\`` : "",
    ``,
    `## 4. Checklist (Tailoring Guide themes; Appendix B row IDs PDF-TBD)`,
    ``,
    `| ID | Title | Status | Evidence |`,
    `| --- | --- | --- | --- |`,
    ...rows,
    ``,
    ...CHECKLIST.flatMap((def) => {
      const state = pack.appendix_b_items.find((i) => i.req_id === def.req_id);
      if (!state?.notes.trim()) return [];
      return [`### ${def.req_id} — ${def.title}`, ``, state.notes, ``];
    }),
    `## 5. Evaluations`,
    ``,
    evals,
    ``,
    `## 6. Thresholds (AO-negotiable)`,
    ``,
    `- **AO negotiated:** ${pack.thresholds.negotiated ? "yes" : "no (proposed)"}`,
    `- **Re-assess trigger:** ${pack.thresholds.reauth_trigger_notes || "_blank_"}`,
    ``,
    `Performance:`,
    perf || "_none_",
    ``,
    `Drift:`,
    drift || "_none_",
    ``,
    `## 7. Residual risk`,
    ``,
    pack.residual_risk.statement || "_blank_",
    ``,
    `Mitigations:`,
    pack.residual_risk.mitigations.filter((m) => m.trim()).map((m) => `- ${m}`).join("\n") || "_none_",
    ``,
    `- **AO decision:** ${pack.residual_risk.ao_decision}`,
    pack.residual_risk.ao_decision_notes ? `- **AO notes:** ${pack.residual_risk.ao_decision_notes}` : "",
    ``,
    `## 8. Continuous monitoring hooks`,
    ``,
    `- **Monitored:** ${pack.conmon_hooks.what_is_monitored || "_blank_"}`,
    `- **Alert owner:** ${pack.conmon_hooks.alert_owner || "_blank_"}`,
    `- **Log sources:** ${pack.conmon_hooks.log_source_refs.filter(Boolean).join(", ") || "_blank_"}`,
    `- **Cadence:** ${pack.conmon_hooks.cadence_notes || "_blank_"}`,
    ``,
    `## 9. Doctrine (public)`,
    ``,
    `- DoD AI Cybersecurity Risk Management Tailoring Guide, 14 July 2025, Version 2.`,
    `- DoDI 8510.01 — technologies below the system level use Assess Only.`,
    `- This kit does not write to eMASS, grant ATOs, or cover DoDD 3000.09.`,
    ``,
  ]
    .filter((row) => row !== "")
    .map(line)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function renderGapReport(pack: EvidencePack): string {
  const c = completeness(pack);
  const identityGaps = c.required_identity.filter((f) => !f.ok).map((f) => `- Missing identity field: \`${f.field}\``);
  const evidenceGaps = c.evidence_missing.map((id) => {
    const def = defFor(id);
    return `- ${id} (${def?.title ?? "item"}) marked met/partial without notes or evidence.`;
  });
  const itemGaps = c.gaps.map(
    (g) => `- **${g.req_id}** [${layerLabel(g.layer)} / ${statusLabel(g.status)}] ${g.title} — ${g.reason}`,
  );

  return [
    `# Gap report — ${pack.pack_id} r${pack.revision}`,
    ``,
    `Completeness score: **${c.score}%**. Export-ready: **${c.export_ready ? "yes" : "no"}**.`,
    ``,
    `| Pending | Met | Partial | Gap | N/A |`,
    `| --- | --- | --- | --- | --- |`,
    `| ${c.items_pending} | ${c.items_met} | ${c.items_partial} | ${c.items_gap} | ${c.items_na} |`,
    ``,
    `## Identity`,
    ``,
    identityGaps.join("\n") || "_Identity fields complete._",
    ``,
    `## Unmet checklist items`,
    ``,
    itemGaps.join("\n") || "_No pending, partial, or explicit gaps._",
    ``,
    `## Evidence missing on assessed items`,
    ``,
    evidenceGaps.join("\n") || "_None._",
    ``,
    `## Other gates`,
    ``,
    `- Evaluations present: ${c.evals_present ? "yes" : "no"}`,
    `- Thresholds filled: ${c.thresholds_filled ? "yes" : "no"}`,
    `- Residual risk statement: ${c.residual_present ? "yes" : "no"}`,
    `- ConMon hooks: ${c.conmon_present ? "yes" : "no"}`,
    ``,
    `Pending items are treated as unmet. This report does not authorize operations.`,
    ``,
  ].join("\n");
}
