import { hashPack } from "./canonical";
import type { EvidencePack, ItemStatus } from "./types";

export type DiffLine = { section: string; change: string };

export type PackDiff = {
  prior_id: string;
  next_id: string;
  chain_ok: boolean | null;
  prior_hash: string;
  next_claims_prior: string | null;
  lines: DiffLine[];
};

function kv(a: string, b: string): string | null {
  if (a === b) return null;
  return `\`${a || "—"}\` → \`${b || "—"}\``;
}

export async function diffPacks(prior: EvidencePack, next: EvidencePack): Promise<PackDiff> {
  const priorHash = await hashPack(prior);
  const claimed = next.chain?.prior_pack_hash ?? null;
  const chain_ok = claimed ? claimed === priorHash : null;
  const lines: DiffLine[] = [];

  const modelBits = [
    ["name", prior.model.name, next.model.name],
    ["version", prior.model.version, next.model.version],
    ["prior_version", prior.model.prior_version, next.model.prior_version],
    ["artifact_hash", prior.model.artifact_hash, next.model.artifact_hash],
    ["catalog_uri", prior.model.catalog_uri, next.model.catalog_uri],
  ] as const;
  for (const [k, a, b] of modelBits) {
    const d = kv(a, b);
    if (d) lines.push({ section: "model", change: `${k}: ${d}` });
  }

  const ev = kv(prior.event.type, next.event.type);
  if (ev) lines.push({ section: "event", change: `type: ${ev}` });
  const rationale = kv(prior.event.rationale, next.event.rationale);
  if (rationale) lines.push({ section: "event", change: `rationale: ${rationale}` });
  const summary = kv(prior.event.change_summary, next.event.change_summary);
  if (summary) lines.push({ section: "event", change: `change_summary: ${summary}` });

  const priorItems = new Map(prior.appendix_b_items.map((i) => [i.req_id, i.status]));
  const nextItems = new Map(next.appendix_b_items.map((i) => [i.req_id, i.status]));
  const ids = new Set([...priorItems.keys(), ...nextItems.keys()]);
  for (const id of [...ids].sort()) {
    const a = (priorItems.get(id) ?? "pending") as ItemStatus;
    const b = (nextItems.get(id) ?? "pending") as ItemStatus;
    if (a !== b) lines.push({ section: "checklist", change: `${id}: ${a} → ${b}` });
  }

  const evalKey = (e: EvidencePack["evaluations"][number]) =>
    `${e.name}|${e.dataset_ref}|${JSON.stringify(e.metrics)}|${e.passed}`;
  const priorEvals = new Set(prior.evaluations.map(evalKey));
  const nextEvals = new Set(next.evaluations.map(evalKey));
  for (const row of next.evaluations) {
    if (!priorEvals.has(evalKey(row))) {
      const metrics = Object.entries(row.metrics)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      lines.push({
        section: "evaluations",
        change: `added ${row.name} (${metrics || "no metrics"}; passed=${row.passed})`,
      });
    }
  }
  for (const row of prior.evaluations) {
    if (!nextEvals.has(evalKey(row))) {
      lines.push({ section: "evaluations", change: `removed ${row.name}` });
    }
  }

  if (prior.thresholds.negotiated !== next.thresholds.negotiated) {
    lines.push({
      section: "thresholds",
      change: `negotiated: ${prior.thresholds.negotiated} → ${next.thresholds.negotiated}`,
    });
  }
  const threshJson = (p: EvidencePack) =>
    JSON.stringify({
      performance: p.thresholds.performance,
      drift: p.thresholds.drift,
      reauth: p.thresholds.reauth_trigger_notes,
    });
  if (threshJson(prior) !== threshJson(next)) {
    lines.push({ section: "thresholds", change: "performance, drift, or re-assess trigger changed" });
  }

  if (prior.residual_risk.ao_decision !== next.residual_risk.ao_decision) {
    lines.push({
      section: "residual_risk",
      change: `ao_decision: ${prior.residual_risk.ao_decision} → ${next.residual_risk.ao_decision}`,
    });
  }
  const risk = kv(prior.residual_risk.statement, next.residual_risk.statement);
  if (risk) lines.push({ section: "residual_risk", change: `statement: ${risk}` });

  const mon = kv(prior.conmon_hooks.what_is_monitored, next.conmon_hooks.what_is_monitored);
  if (mon) lines.push({ section: "conmon", change: `what_is_monitored: ${mon}` });

  return {
    prior_id: prior.pack_id,
    next_id: next.pack_id,
    chain_ok,
    prior_hash: priorHash,
    next_claims_prior: claimed,
    lines,
  };
}

export function renderDiffMarkdown(diff: PackDiff): string {
  const chain =
    diff.chain_ok === true
      ? "YES — next.chain.prior_pack_hash matches canonical hash of prior."
      : diff.chain_ok === false
        ? "NO — next.chain.prior_pack_hash does not match prior. Treat as an unlinked pack."
        : "UNCLAIMED — next has no prior_pack_hash. Link it before AO review.";
  const body = diff.lines.length
    ? diff.lines.map((l) => `- **${l.section}:** ${l.change}`).join("\n")
    : "_No field-level changes detected._";
  return [
    `# Assess-Only pack diff`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.**`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Prior | \`${diff.prior_id}\` |`,
    `| Next | \`${diff.next_id}\` |`,
    `| Prior hash | \`${diff.prior_hash}\` |`,
    `| Next claims | \`${diff.next_claims_prior || "—"}\` |`,
    `| Chain valid | ${chain} |`,
    ``,
    `## Changes`,
    ``,
    body,
    ``,
  ].join("\n");
}
