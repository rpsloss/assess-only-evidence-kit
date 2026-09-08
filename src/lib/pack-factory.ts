import { CHECKLIST } from "./checklist";
import { SCHEMA_VERSION, type EvidencePack, type ItemStatus } from "./types";
import { nowIso, uid } from "./utils";

export function emptyItemStates(): EvidencePack["appendix_b_items"] {
  return CHECKLIST.map((def) => ({
    req_id: def.req_id,
    status: "pending" as ItemStatus,
    evidence_refs: [],
    notes: "",
  }));
}

export function createBlankPack(): EvidencePack {
  const ts = nowIso();
  return {
    schema_version: SCHEMA_VERSION,
    pack_id: uid("pck"),
    revision: 1,
    created_at: ts,
    updated_at: ts,
    author_role: "ISSM",
    author_name: "",
    marking: "UNCLASSIFIED",
    system_context: {
      system_name: "",
      ato_id_or_ref: "",
      boundary_notes: "",
      environment_notes: "",
    },
    model: {
      name: "",
      task: "supervised_classifier",
      prior_version: "",
      version: "",
      artifact_hash: "",
      hash_alg: "sha256",
      training_data_provenance_ref: "",
      catalog_uri: "",
    },
    event: {
      type: "model_version_bump",
      rationale: "",
      change_summary: "",
    },
    appendix_b_items: emptyItemStates(),
    evaluations: [],
    thresholds: {
      negotiated: false,
      performance: [
        { metric: "F1", operator: ">=", value: "", unit: "" },
        { metric: "precision", operator: ">=", value: "", unit: "" },
      ],
      drift: [
        { metric: "PSI", operator: "<=", value: "", method: "population_stability_index" },
      ],
      reauth_trigger_notes: "",
    },
    residual_risk: {
      statement: "",
      mitigations: [""],
      ao_decision: "pending",
      ao_decision_notes: "",
    },
    conmon_hooks: {
      what_is_monitored: "",
      alert_owner: "",
      log_source_refs: [""],
      cadence_notes: "",
    },
    baseline_pack_id: null,
    files: [],
  };
}

export function clonePack(pack: EvidencePack, opts?: { newId?: boolean }): EvidencePack {
  const copy = structuredClone(pack);
  if (opts?.newId !== false) {
    copy.pack_id = uid("pck");
    copy.created_at = nowIso();
    copy.updated_at = copy.created_at;
    copy.revision = 1;
  }
  return copy;
}

export function bumpFromBaseline(prior: EvidencePack): EvidencePack {
  const next = createBlankPack();
  next.baseline_pack_id = prior.pack_id;
  next.author_role = prior.author_role;
  next.author_name = prior.author_name;
  next.marking = prior.marking;
  next.system_context = structuredClone(prior.system_context);
  next.model = {
    ...structuredClone(prior.model),
    prior_version: prior.model.version || prior.model.prior_version,
    version: "",
    artifact_hash: "",
  };
  next.event = {
    type: "model_version_bump",
    rationale: `Baseline ${prior.pack_id} r${prior.revision} (${prior.model.name} ${prior.model.version}). Verify infra items still hold; re-assess model-layer items for the new version.`,
    change_summary: "",
  };
  next.thresholds = structuredClone(prior.thresholds);
  next.conmon_hooks = structuredClone(prior.conmon_hooks);
  next.appendix_b_items = prior.appendix_b_items.map((item) => {
    const isInfra = item.req_id.startsWith("INF-");
    return {
      req_id: item.req_id,
      status: isInfra ? item.status : "pending",
      evidence_refs: isInfra ? structuredClone(item.evidence_refs) : [],
      notes: isInfra
        ? [item.notes, `Carried forward from ${prior.pack_id} r${prior.revision}. Re-verify for this bump.`]
            .filter(Boolean)
            .join(" ")
        : `Prior status ${item.status}. Re-assess for new model version.`,
    };
  });
  return next;
}
