import { CHECKLIST, CHECKLIST_BY_ID } from "./checklist";
import type { ChecklistItemState, EvidencePack, ItemStatus, Layer } from "./types";

export type GapEntry = {
  req_id: string;
  layer: Layer;
  title: string;
  status: ItemStatus;
  notes: string;
  reason: string;
};

export type Completeness = {
  required_identity: { field: string; ok: boolean }[];
  identity_ok: boolean;
  items_total: number;
  items_pending: number;
  items_met: number;
  items_partial: number;
  items_gap: number;
  items_na: number;
  items_assessed: number;
  evidence_missing: string[];
  evals_present: boolean;
  thresholds_filled: boolean;
  residual_present: boolean;
  conmon_present: boolean;
  gaps: GapEntry[];
  score: number;
  export_ready: boolean;
};

const IDENTITY_FIELDS: { field: string; get: (p: EvidencePack) => string }[] = [
  { field: "system_name", get: (p) => p.system_context.system_name },
  { field: "ato_id_or_ref", get: (p) => p.system_context.ato_id_or_ref },
  { field: "model.name", get: (p) => p.model.name },
  { field: "model.version", get: (p) => p.model.version },
  { field: "model.prior_version", get: (p) => p.model.prior_version },
  { field: "model.artifact_hash", get: (p) => p.model.artifact_hash },
  { field: "event.rationale", get: (p) => p.event.rationale },
];

function hasEvidence(item: ChecklistItemState): boolean {
  if (item.notes.trim().length > 0) return true;
  return item.evidence_refs.some((ref) => ref.value.trim().length > 0);
}

export function itemById(pack: EvidencePack, reqId: string): ChecklistItemState | undefined {
  return pack.appendix_b_items.find((item) => item.req_id === reqId);
}

export function statusCounts(pack: EvidencePack) {
  const counts = { pending: 0, met: 0, partial: 0, gap: 0, na: 0 };
  for (const item of pack.appendix_b_items) {
    counts[item.status] += 1;
  }
  return counts;
}

export function collectGaps(pack: EvidencePack): GapEntry[] {
  const gaps: GapEntry[] = [];
  for (const def of CHECKLIST) {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    if (status === "met" || status === "na") continue;
    let reason = "";
    if (status === "pending") reason = "Not yet assessed.";
    else if (status === "gap") reason = "Explicit gap.";
    else if (status === "partial") reason = "Partial — residual work remains.";
    if (status === "partial" && state && !hasEvidence(state)) {
      reason += " No evidence URI, attachment, or notes.";
    }
    gaps.push({
      req_id: def.req_id,
      layer: def.layer,
      title: def.title,
      status,
      notes: state?.notes ?? "",
      reason: reason.trim(),
    });
  }
  return gaps;
}

export function completeness(pack: EvidencePack): Completeness {
  const required_identity = IDENTITY_FIELDS.map(({ field, get }) => ({
    field,
    ok: get(pack).trim().length > 0,
  }));
  const identity_ok = required_identity.every((f) => f.ok);
  const counts = statusCounts(pack);
  const evidence_missing = pack.appendix_b_items
    .filter((item) => (item.status === "met" || item.status === "partial") && !hasEvidence(item))
    .map((item) => item.req_id);
  const gaps = collectGaps(pack);
  const evals_present = pack.evaluations.some((e) => e.name.trim().length > 0);
  const thresholds_filled =
    pack.thresholds.performance.some((t) => t.value.trim().length > 0) ||
    pack.thresholds.drift.some((t) => t.value.trim().length > 0) ||
    pack.thresholds.reauth_trigger_notes.trim().length > 0;
  const residual_present = pack.residual_risk.statement.trim().length > 0;
  const conmon_present = pack.conmon_hooks.what_is_monitored.trim().length > 0;
  const items_assessed = counts.met + counts.partial + counts.gap + counts.na;
  const identityScore = required_identity.filter((f) => f.ok).length / required_identity.length;
  const itemScore = items_assessed / Math.max(CHECKLIST.length, 1);
  const extras =
    (evals_present ? 1 : 0) +
    (thresholds_filled ? 1 : 0) +
    (residual_present ? 1 : 0) +
    (conmon_present ? 1 : 0);
  const score = Math.round((identityScore * 0.25 + itemScore * 0.55 + (extras / 4) * 0.2) * 100);
  const export_ready =
    identity_ok && counts.pending === 0 && evidence_missing.length === 0 && residual_present;
  return {
    required_identity,
    identity_ok,
    items_total: CHECKLIST.length,
    items_pending: counts.pending,
    items_met: counts.met,
    items_partial: counts.partial,
    items_gap: counts.gap,
    items_na: counts.na,
    items_assessed,
    evidence_missing,
    evals_present,
    thresholds_filled,
    residual_present,
    conmon_present,
    gaps,
    score,
    export_ready,
  };
}

export function layerLabel(layer: Layer): string {
  return layer === "infra" ? "Infrastructure layer" : "AI model layer";
}

export function statusLabel(status: ItemStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "met":
      return "Met";
    case "partial":
      return "Partial";
    case "gap":
      return "Gap";
    case "na":
      return "N/A";
  }
}

export function defFor(reqId: string) {
  return CHECKLIST_BY_ID[reqId];
}
