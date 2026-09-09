import { CHECKLIST } from "./checklist";
import { createBlankPack } from "./pack-factory";
import {
  SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  type ChecklistItemState,
  type EvidencePack,
  type ItemStatus,
} from "./types";

const STATUSES = new Set<ItemStatus>(["pending", "met", "partial", "gap", "na"]);

export type ParseResult = { ok: true; pack: EvidencePack } | { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mergeItems(raw: unknown): ChecklistItemState[] {
  const byId = new Map<string, ChecklistItemState>();
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const rec = asRecord(entry);
      if (!rec) continue;
      const req_id = str(rec.req_id);
      if (!req_id) continue;
      const status = STATUSES.has(rec.status as ItemStatus) ? (rec.status as ItemStatus) : "pending";
      const refs = Array.isArray(rec.evidence_refs)
        ? rec.evidence_refs
            .map((ref) => {
              const r = asRecord(ref);
              if (!r) return null;
              const kind = r.kind === "file" ? "file" : "uri";
              return {
                id: str(r.id) || `ref_${req_id}`,
                kind: kind as "uri" | "file",
                value: str(r.value),
                note: str(r.note),
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null)
        : [];
      byId.set(req_id, { req_id, status, evidence_refs: refs, notes: str(rec.notes) });
    }
  }
  return CHECKLIST.map((def) => byId.get(def.req_id) ?? {
    req_id: def.req_id,
    status: "pending",
    evidence_refs: [],
    notes: "",
  });
}

export function parsePackJson(raw: unknown): ParseResult {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return { ok: false, error: "Not valid JSON." };
    }
  }
  const obj = asRecord(value);
  if (!obj) return { ok: false, error: "Pack must be a JSON object." };
  if (
    obj.schema_version &&
    !SUPPORTED_SCHEMA_VERSIONS.includes(obj.schema_version as (typeof SUPPORTED_SCHEMA_VERSIONS)[number])
  ) {
    return { ok: false, error: `Unsupported schema_version (expected ${SUPPORTED_SCHEMA_VERSIONS.join(" or ")}).` };
  }

  const base = createBlankPack();
  const sys = asRecord(obj.system_context) ?? {};
  const model = asRecord(obj.model) ?? {};
  const event = asRecord(obj.event) ?? {};
  const residual = asRecord(obj.residual_risk) ?? {};
  const conmon = asRecord(obj.conmon_hooks) ?? {};
  const thresholds = asRecord(obj.thresholds) ?? {};
  const authorRole = str(obj.author_role, base.author_role);
  const eventType = str(event.type, base.event.type);

  const pack: EvidencePack = {
    ...base,
    pack_id: str(obj.pack_id, base.pack_id),
    revision: typeof obj.revision === "number" && obj.revision >= 1 ? Math.floor(obj.revision) : 1,
    created_at: str(obj.created_at, base.created_at),
    updated_at: str(obj.updated_at, base.updated_at),
    author_role: (authorRole as EvidencePack["author_role"]) || base.author_role,
    author_name: str(obj.author_name),
    marking: str(obj.marking, "UNCLASSIFIED") || "UNCLASSIFIED",
    system_context: {
      system_name: str(sys.system_name),
      ato_id_or_ref: str(sys.ato_id_or_ref),
      boundary_notes: str(sys.boundary_notes),
      environment_notes: str(sys.environment_notes),
    },
    model: {
      name: str(model.name),
      task: str(model.task, base.model.task),
      prior_version: str(model.prior_version),
      version: str(model.version),
      artifact_hash: str(model.artifact_hash),
      hash_alg: str(model.hash_alg, "sha256"),
      training_data_provenance_ref: str(model.training_data_provenance_ref),
      catalog_uri: str(model.catalog_uri),
    },
    event: {
      type:
        eventType === "retrain" || eventType === "threshold_breach" || eventType === "model_version_bump"
          ? eventType
          : "model_version_bump",
      rationale: str(event.rationale),
      change_summary: str(event.change_summary),
    },
    appendix_b_items: mergeItems(obj.appendix_b_items),
    evaluations: Array.isArray(obj.evaluations)
      ? obj.evaluations
          .map((ev, i) => {
            const rec = asRecord(ev);
            if (!rec) return null;
            return {
              id: str(rec.id, `eval_${i}`),
              name: str(rec.name),
              dataset_ref: str(rec.dataset_ref),
              metrics:
                rec.metrics && typeof rec.metrics === "object"
                  ? Object.fromEntries(
                      Object.entries(rec.metrics as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
                    )
                  : {},
              passed: typeof rec.passed === "boolean" ? rec.passed : null,
              raw_artifact_uri: str(rec.raw_artifact_uri),
            };
          })
          .filter((e): e is NonNullable<typeof e> => e !== null)
      : [],
    thresholds: {
      negotiated: Boolean(thresholds.negotiated),
      performance: Array.isArray(thresholds.performance)
        ? thresholds.performance
            .map((row) => {
              const rec = asRecord(row);
              if (!rec) return null;
              return {
                metric: str(rec.metric),
                operator: (str(rec.operator, ">=") as ">=" | "<=" | ">") || ">=",
                value: str(rec.value),
                unit: str(rec.unit),
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null)
        : base.thresholds.performance,
      drift: Array.isArray(thresholds.drift)
        ? thresholds.drift
            .map((row) => {
              const rec = asRecord(row);
              if (!rec) return null;
              return {
                metric: str(rec.metric),
                operator: (str(rec.operator, "<=") as "<=" | "<") || "<=",
                value: str(rec.value),
                method: str(rec.method),
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null)
        : base.thresholds.drift,
      reauth_trigger_notes: str(thresholds.reauth_trigger_notes),
    },
    residual_risk: {
      statement: str(residual.statement),
      mitigations: Array.isArray(residual.mitigations)
        ? residual.mitigations.map((m) => String(m))
        : [""],
      ao_decision:
        residual.ao_decision === "accepted" || residual.ao_decision === "rejected"
          ? residual.ao_decision
          : "pending",
      ao_decision_notes: str(residual.ao_decision_notes),
    },
    conmon_hooks: {
      what_is_monitored: str(conmon.what_is_monitored),
      alert_owner: str(conmon.alert_owner),
      log_source_refs: Array.isArray(conmon.log_source_refs)
        ? conmon.log_source_refs.map((s) => String(s))
        : [""],
      cadence_notes: str(conmon.cadence_notes),
    },
    chain: (() => {
      const ch = asRecord(obj.chain);
      const priorId =
        str(ch?.prior_pack_id) ||
        (typeof obj.baseline_pack_id === "string" ? obj.baseline_pack_id : "");
      const priorHash = str(ch?.prior_pack_hash);
      return {
        prior_pack_id: priorId || null,
        prior_pack_hash: priorHash || null,
      };
    })(),
    baseline_pack_id:
      typeof obj.baseline_pack_id === "string"
        ? obj.baseline_pack_id
        : str(asRecord(obj.chain)?.prior_pack_id) || null,
    files: Array.isArray(obj.files)
      ? obj.files
          .map((file, i) => {
            const rec = asRecord(file);
            if (!rec) return null;
            return {
              id: str(rec.id, `file_${i}`),
              filename: str(rec.filename),
              mime: str(rec.mime, "text/plain"),
              size_bytes: typeof rec.size_bytes === "number" ? rec.size_bytes : 0,
              data_base64: str(rec.data_base64),
            };
          })
          .filter((f): f is NonNullable<typeof f> => f !== null && f.filename.length > 0)
      : [],
  };

  if (!pack.pack_id.trim()) return { ok: false, error: "pack_id is required." };
  return { ok: true, pack };
}
