import { CHECKLIST } from "./checklist";
import { completeness, hasEvidence, itemById, layerLabel, statusLabel } from "./completeness";
import type { EvidencePack, ItemStatus, Layer } from "./types";

/** AO-facing buckets. Stored status stays met/partial/gap/pending/na. */
export type BoardBucket = "present" | "subpar" | "gapped" | "unfinished";

export type BoardItem = {
  req_id: string;
  layer: Layer;
  title: string;
  status: ItemStatus;
  bucket: BoardBucket;
  has_evidence: boolean;
  reason: string;
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
  subpar: BoardItem[];
  gapped: BoardItem[];
  unfinished: BoardItem[];
  counts: Record<BoardBucket, number> & { total: number };
  by_layer: Record<Layer, Record<BoardBucket, number>>;
  gates: ExportGate[];
  export_ready: boolean;
};

export function bucketLabel(bucket: BoardBucket): string {
  switch (bucket) {
    case "present":
      return "Present";
    case "subpar":
      return "Sub-par";
    case "gapped":
      return "Gapped";
    case "unfinished":
      return "Unfinished";
  }
}

/** Classify one checklist row for an AO scan. Met-without-evidence is sub-par, not present. */
export function classifyItem(status: ItemStatus, evidenced: boolean): { bucket: BoardBucket; reason: string } {
  if (status === "pending") return { bucket: "unfinished", reason: "Not yet assessed." };
  if (status === "gap") return { bucket: "gapped", reason: "Explicit gap." };
  if (status === "na") return { bucket: "present", reason: "Assessed N/A." };
  if (status === "met" && evidenced) return { bucket: "present", reason: "Met with notes or evidence." };
  if (status === "met") return { bucket: "subpar", reason: "Marked met without notes or evidence URI." };
  if (status === "partial") {
    return {
      bucket: "subpar",
      reason: evidenced ? "Partial — residual work remains." : "Partial, and no notes or evidence URI.",
    };
  }
  return { bucket: "unfinished", reason: "Not yet assessed." };
}

export function statusBoard(pack: EvidencePack): StatusBoard {
  const c = completeness(pack);
  const empty = { present: 0, subpar: 0, gapped: 0, unfinished: 0 };
  const by_layer: StatusBoard["by_layer"] = {
    infra: { ...empty },
    model: { ...empty },
  };
  const items: BoardItem[] = CHECKLIST.map((def) => {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    const evidenced = state ? hasEvidence(state) : false;
    const { bucket, reason } = classifyItem(status, evidenced);
    by_layer[def.layer][bucket] += 1;
    return {
      req_id: def.req_id,
      layer: def.layer,
      title: def.title,
      status,
      bucket,
      has_evidence: evidenced,
      reason,
    };
  });
  const present = items.filter((i) => i.bucket === "present");
  const subpar = items.filter((i) => i.bucket === "subpar");
  const gapped = items.filter((i) => i.bucket === "gapped");
  const unfinished = items.filter((i) => i.bucket === "unfinished");
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
      label: c.items_pending === 0 ? "No unfinished (pending) items" : `${c.items_pending} unfinished item(s)`,
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
    subpar,
    gapped,
    unfinished,
    counts: {
      present: present.length,
      subpar: subpar.length,
      gapped: gapped.length,
      unfinished: unfinished.length,
      total: items.length,
    },
    by_layer,
    gates,
    export_ready: c.export_ready,
  };
}

function check(ok: boolean): string {
  return ok ? "[x]" : "[ ]";
}

function row(item: BoardItem): string {
  return `| ${item.req_id} | ${item.title} | ${bucketLabel(item.bucket)} | ${statusLabel(item.status)} | ${item.reason} |`;
}

/** AO-facing scan page: gates, then 22 rows bucketed. Lives in the zip as status.md. */
export function renderStatusMarkdown(pack: EvidencePack): string {
  const board = statusBoard(pack);
  const infra = board.items.filter((i) => i.layer === "infra");
  const model = board.items.filter((i) => i.layer === "model");
  const attention = [...board.unfinished, ...board.gapped, ...board.subpar];
  return [
    `# Assess-Only status board`,
    ``,
    `**UNCLASSIFIED. This is not an ATO.** Host holds the authorization. Scan this page first, then residual risk in brief.md.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Export-ready | ${board.export_ready ? "yes" : "no"} |`,
    `| Present | ${board.counts.present} |`,
    `| Sub-par | ${board.counts.subpar} |`,
    `| Gapped | ${board.counts.gapped} |`,
    `| Unfinished | ${board.counts.unfinished} |`,
    ``,
    `Present = met (with evidence) or N/A. Sub-par = partial, or met/partial with no notes or URI. Gapped = explicit gap. Unfinished = pending.`,
    ``,
    `## Why this pack is ${board.export_ready ? "ready" : "not ready"}`,
    ``,
    ...board.gates.map((g) => `- ${check(g.ok)} ${g.blocking ? "" : "(info) "}${g.label}`),
    ``,
    `## ${layerLabel("infra")} (${board.by_layer.infra.present} present / ${board.by_layer.infra.subpar} sub-par / ${board.by_layer.infra.gapped} gapped / ${board.by_layer.infra.unfinished} unfinished)`,
    ``,
    `| ID | Title | Board | Status | Why |`,
    `| --- | --- | --- | --- | --- |`,
    ...infra.map(row),
    ``,
    `## ${layerLabel("model")} (${board.by_layer.model.present} present / ${board.by_layer.model.subpar} sub-par / ${board.by_layer.model.gapped} gapped / ${board.by_layer.model.unfinished} unfinished)`,
    ``,
    `| ID | Title | Board | Status | Why |`,
    `| --- | --- | --- | --- | --- |`,
    ...model.map(row),
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
