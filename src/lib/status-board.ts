import { CHECKLIST } from "./checklist";
import { completeness, hasEvidence, itemById, layerLabel, statusLabel } from "./completeness";
import type { EvidencePack, ItemStatus, Layer } from "./types";

/**
 * Assembler/AO scan buckets. These are the stored statuses, renamed for a scan:
 * present = met | na, partial = partial, gapped = gap, unfinished = pending.
 * Missing evidence is a gate, not a fourth meaning of "partial".
 */
export type BoardBucket = "present" | "partial" | "gapped" | "unfinished";

export type BoardItem = {
  req_id: string;
  layer: Layer;
  title: string;
  status: ItemStatus;
  bucket: BoardBucket;
  has_evidence: boolean;
  reason: string;
  origin: "inherited" | "this_event";
  inherited_from: string | null;
};

export type ExportGate = {
  id: string;
  ok: boolean;
  blocking: boolean;
  label: string;
};

export type StatusBoard = {
  items: BoardItem[];
  present: BoardItem[];
  partial: BoardItem[];
  gapped: BoardItem[];
  unfinished: BoardItem[];
  counts: Record<BoardBucket, number> & { total: number };
  by_layer: Record<Layer, Record<BoardBucket, number>>;
  gates: ExportGate[];
  export_ready: boolean;
  inherited: BoardItem[];
  this_event: BoardItem[];
};

export function bucketLabel(bucket: BoardBucket): string {
  switch (bucket) {
    case "present":
      return "Present";
    case "partial":
      return "Partial";
    case "gapped":
      return "Gapped";
    case "unfinished":
      return "Unfinished";
  }
}

export function classifyItem(status: ItemStatus, evidenced: boolean): { bucket: BoardBucket; reason: string } {
  if (status === "pending") return { bucket: "unfinished", reason: "Not yet assessed." };
  if (status === "gap") return { bucket: "gapped", reason: "Explicit gap." };
  if (status === "na") return { bucket: "present", reason: "Assessed N/A." };
  if (status === "partial") {
    return {
      bucket: "partial",
      reason: evidenced ? "Partial — residual work remains." : "Partial, and no notes or evidence URI.",
    };
  }
  if (status === "met") {
    return {
      bucket: "present",
      reason: evidenced ? "Met." : "Met, but no notes or evidence URI.",
    };
  }
  return { bucket: "unfinished", reason: "Not yet assessed." };
}

export function statusBoard(pack: EvidencePack): StatusBoard {
  const c = completeness(pack);
  const empty = { present: 0, partial: 0, gapped: 0, unfinished: 0 };
  const by_layer: StatusBoard["by_layer"] = {
    infra: { ...empty },
    model: { ...empty },
  };
  const items: BoardItem[] = CHECKLIST.map((def) => {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    const evidenced = state ? hasEvidence(state) : false;
    const { bucket, reason } = classifyItem(status, evidenced);
    const inherited_from = state?.inherited_from?.trim() || null;
    by_layer[def.layer][bucket] += 1;
    return {
      req_id: def.req_id,
      layer: def.layer,
      title: def.title,
      status,
      bucket,
      has_evidence: evidenced,
      reason,
      origin: inherited_from ? "inherited" : "this_event",
      inherited_from,
    };
  });
  const present = items.filter((i) => i.bucket === "present");
  const partial = items.filter((i) => i.bucket === "partial");
  const gapped = items.filter((i) => i.bucket === "gapped");
  const unfinished = items.filter((i) => i.bucket === "unfinished");
  const inherited = items.filter((i) => i.origin === "inherited");
  const this_event = items.filter((i) => i.origin === "this_event");
  const gates: ExportGate[] = [
    {
      id: "identity",
      ok: c.identity_ok,
      blocking: true,
      label: `Identity fields${c.identity_ok ? "" : ` missing: ${c.required_identity.filter((f) => !f.ok).map((f) => f.field).join(", ")}`}`,
    },
    {
      id: "pending",
      ok: c.items_pending === 0,
      blocking: true,
      label: c.items_pending === 0 ? "No unfinished items" : `${c.items_pending} unfinished item(s)`,
    },
    {
      id: "evidence",
      ok: c.evidence_missing.length === 0,
      blocking: true,
      label:
        c.evidence_missing.length === 0
          ? "Assessed items have notes or evidence"
          : `No evidence on ${c.evidence_missing.join(", ")}`,
    },
    {
      id: "residual",
      ok: c.residual_present,
      blocking: true,
      label: c.residual_present ? "Residual-risk statement present" : "Residual-risk statement is blank",
    },
    { id: "evals", ok: c.evals_present, blocking: false, label: "Evaluations recorded" },
    { id: "thresholds", ok: c.thresholds_filled, blocking: false, label: "Performance or drift threshold filled" },
    { id: "conmon", ok: c.conmon_present, blocking: false, label: "ConMon hook described" },
  ];
  return {
    items,
    present,
    partial,
    gapped,
    unfinished,
    counts: {
      present: present.length,
      partial: partial.length,
      gapped: gapped.length,
      unfinished: unfinished.length,
      total: items.length,
    },
    by_layer,
    gates,
    export_ready: c.export_ready,
    inherited,
    this_event,
  };
}

function check(ok: boolean): string {
  return ok ? "[x]" : "[ ]";
}

function row(item: BoardItem): string {
  const origin = item.origin === "inherited" ? `inherited (${item.inherited_from})` : "this event";
  return `| ${item.req_id} | ${item.title} | ${bucketLabel(item.bucket)} | ${statusLabel(item.status)} | ${origin} | ${item.reason} |`;
}

function layerCounts(layer: Layer, board: StatusBoard): string {
  const c = board.by_layer[layer];
  return `${c.present} present / ${c.partial} partial / ${c.gapped} gapped / ${c.unfinished} unfinished`;
}

/** Scan page for the AO/SCA zip. Assembler uses the same board in the app. */
export function renderStatusMarkdown(pack: EvidencePack): string {
  const board = statusBoard(pack);
  const infra = board.items.filter((i) => i.layer === "infra");
  const model = board.items.filter((i) => i.layer === "model");
  const attention = [...board.unfinished, ...board.gapped, ...board.partial];
  return [
    `# Assess-Only status board`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.** Host holds the authorization. Scan this page first, then residual risk in brief.md.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Ready for AO/SCA | ${board.export_ready ? "yes" : "no"} |`,
    `| Present | ${board.counts.present} |`,
    `| Partial | ${board.counts.partial} |`,
    `| Gapped | ${board.counts.gapped} |`,
    `| Unfinished | ${board.counts.unfinished} |`,
    `| Inherited | ${board.inherited.length} |`,
    `| This event | ${board.this_event.length} |`,
    ``,
    `Present = met or N/A. Partial = assessed, residual work remains. Gapped = explicit gap. Unfinished = pending.`,
    `Inherited = carried forward from a prior pack (usually infrastructure). This event = re-assessed for this bump.`,
    ``,
    `## Why this pack is ${board.export_ready ? "ready for AO/SCA" : "not ready for AO/SCA"}`,
    ``,
    ...board.gates.map((g) => `- ${check(g.ok)} ${g.blocking ? "" : "(info) "}${g.label}`),
    ``,
    `## ${layerLabel("infra")} (${layerCounts("infra", board)})`,
    ``,
    `| ID | Title | Board | Status | Origin | Why |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...infra.map(row),
    ``,
    `## ${layerLabel("model")} (${layerCounts("model", board)})`,
    ``,
    `| ID | Title | Board | Status | Origin | Why |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...model.map(row),
    ``,
    `## Inheritance`,
    ``,
    board.inherited.length
      ? board.inherited.map((i) => `- **${i.req_id}** inherited from \`${i.inherited_from}\` (${statusLabel(i.status)}). Re-verify that the host control still holds.`).join("\n")
      : "_No items marked inherited. This pack is a genesis event, or carry-forward was not stamped._",
    ``,
    `## Needs attention`,
    ``,
    attention.length
      ? attention.map((i) => `- **${i.req_id}** (${bucketLabel(i.bucket)}): ${i.reason}`).join("\n")
      : "_None. Every item is present._",
    ``,
    `This board does not authorize operations. Attach the zip to the host package if the AO accepts residual risk.`,
    ``,
  ].join("\n");
}
