import { completeness, statusLabel } from "./completeness";
import type { PackDiff } from "./diff-pack";
import type { EvidencePack } from "./types";

/** Twenty-minute AO read: identity, gaps, residual risk, optional diff. */
export function renderBrief(pack: EvidencePack, diff?: PackDiff | null): string {
  const c = completeness(pack);
  const gaps = c.gaps
    .filter((g) => g.status === "gap" || g.status === "partial" || g.status === "pending")
    .map((g) => `- **${g.req_id}** (${statusLabel(g.status)}): ${g.title}${g.notes ? ` — ${g.notes}` : ""}`);
  const evals = pack.evaluations.map((ev) => {
    const metrics = Object.entries(ev.metrics)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const pass = ev.passed === null ? "n/a" : ev.passed ? "pass" : "fail";
    return `- ${ev.name}: ${pass}${metrics ? ` (${metrics})` : ""}`;
  });
  const chain = pack.chain.prior_pack_id
    ? `\`${pack.chain.prior_pack_id}\` / \`${pack.chain.prior_pack_hash || "unsealed"}\``
    : "genesis (no prior)";
  const diffBlock =
    diff && diff.lines.length
      ? [
          `## What changed vs prior`,
          ``,
          diff.chain_ok === true
            ? "Chain hash: **valid**."
            : diff.chain_ok === false
              ? "Chain hash: **INVALID**."
              : "Chain hash: unclaimed.",
          ``,
          ...diff.lines.slice(0, 24).map((l) => `- ${l.section}: ${l.change}`),
          diff.lines.length > 24 ? `- … ${diff.lines.length - 24} more` : "",
          ``,
        ]
      : [];

  return [
    `# Assess-Only brief`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.** Host holds the authorization. Model is incorporated via Assess Only.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Host | ${pack.system_context.system_name || "—"} |`,
    `| ATO ref | ${pack.system_context.ato_id_or_ref || "—"} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Artifact | \`${pack.model.artifact_hash || "—"}\` |`,
    `| Event | ${pack.event.type} |`,
    `| Completeness | ${c.score}% (${c.items_assessed}/${c.items_total} assessed) |`,
    `| AO decision | ${pack.residual_risk.ao_decision} |`,
    `| Prior | ${chain} |`,
    ``,
    `## Event`,
    ``,
    pack.event.rationale || "_No rationale._",
    ``,
    pack.event.change_summary || "",
    ``,
    `## Evaluations`,
    ``,
    evals.join("\n") || "_None._",
    ``,
    `## Open items (gap / partial / pending)`,
    ``,
    gaps.join("\n") || "_None._",
    ``,
    `## Residual risk`,
    ``,
    pack.residual_risk.statement || "_Blank._",
    ``,
    ...pack.residual_risk.mitigations.filter(Boolean).map((m) => `- ${m}`),
    ``,
    `## ConMon`,
    ``,
    pack.conmon_hooks.what_is_monitored || "_Blank._",
    pack.conmon_hooks.cadence_notes ? `\nCadence: ${pack.conmon_hooks.cadence_notes}` : "",
    ``,
    ...diffBlock,
    `---`,
    ``,
    `Do not treat this brief as authorization. Attach the zip to the host package if the AO accepts residual risk.`,
    ``,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
