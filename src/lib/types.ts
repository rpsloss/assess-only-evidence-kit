export const EVENT_TYPES = [
  "model_version_bump",
  "retrain",
  "threshold_breach",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const ITEM_STATUSES = [
  "pending",
  "met",
  "partial",
  "gap",
  "na",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const LAYERS = ["infra", "model"] as const;
export type Layer = (typeof LAYERS)[number];

export const AUTHOR_ROLES = [
  "ISSM",
  "ISSO",
  "cybersecurity_engineer",
  "model_owner",
  "mlops",
  "other",
] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export const AO_DECISIONS = ["pending", "accepted", "rejected"] as const;
export type AoDecision = (typeof AO_DECISIONS)[number];

/** eMASS-style residual levels. Empty string means not yet set. */
export const RISK_LEVELS = ["very_low", "low", "moderate", "high", "very_high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type PoamEntry = {
  task: string;
  owner: string;
  resources: string;
  milestone: string;
  scheduled_date: string;
  residual_risk_level: RiskLevel | "";
};

export const NIST_AI_RMF = ["Govern", "Map", "Measure", "Manage"] as const;
export type NistAiRmf = (typeof NIST_AI_RMF)[number];

export type EvidenceRef = {
  id: string;
  kind: "uri" | "file";
  value: string;
  note: string;
};

export type EvidenceFile = {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  data_base64: string;
};

export type ChecklistItemState = {
  req_id: string;
  status: ItemStatus;
  evidence_refs: EvidenceRef[];
  notes: string;
  /** Present only for partial/gap rows the assembler has scheduled. Omitted when empty. */
  poam?: PoamEntry;
  /** Prior pack_id if this row was carried forward on a bump. Omitted for this-event items. */
  inherited_from?: string;
};

export type Evaluation = {
  id: string;
  name: string;
  dataset_ref: string;
  metrics: Record<string, string>;
  passed: boolean | null;
  raw_artifact_uri: string;
};

export type PerformanceThreshold = {
  metric: string;
  operator: ">=" | "<=" | ">";
  value: string;
  unit: string;
};

export type DriftThreshold = {
  metric: string;
  operator: "<=" | "<";
  value: string;
  method: string;
};

export type PackChain = {
  prior_pack_id: string | null;
  prior_pack_hash: string | null;
};

export type EvidencePack = {
  schema_version: "0.3.0";
  pack_id: string;
  revision: number;
  created_at: string;
  updated_at: string;
  author_role: AuthorRole;
  author_name: string;
  marking: string;
  system_context: {
    system_name: string;
    ato_id_or_ref: string;
    boundary_notes: string;
    environment_notes: string;
  };
  model: {
    name: string;
    task: string;
    prior_version: string;
    version: string;
    artifact_hash: string;
    hash_alg: string;
    training_data_provenance_ref: string;
    catalog_uri: string;
  };
  event: {
    type: EventType;
    rationale: string;
    change_summary: string;
  };
  appendix_b_items: ChecklistItemState[];
  evaluations: Evaluation[];
  thresholds: {
    negotiated: boolean;
    performance: PerformanceThreshold[];
    drift: DriftThreshold[];
    reauth_trigger_notes: string;
  };
  residual_risk: {
    statement: string;
    mitigations: string[];
    ao_decision: AoDecision;
    ao_decision_notes: string;
  };
  conmon_hooks: {
    what_is_monitored: string;
    alert_owner: string;
    log_source_refs: string[];
    cadence_notes: string;
  };
  chain: PackChain;
  /** @deprecated alias of chain.prior_pack_id */
  baseline_pack_id: string | null;
  files: EvidenceFile[];
};

export type ChecklistDef = {
  req_id: string;
  layer: Layer;
  title: string;
  prompt: string;
  evidence_hint: string;
  theme: string;
  appendix_ref: string;
  pdf_row_id: "PDF-TBD";
  controls: string[];
  nist_ai_rmf: NistAiRmf[];
  threat_refs: string[];
};

export const SCHEMA_VERSION = "0.3.0" as const;
export const SCHEMA_ID =
  "https://rpsloss.github.io/assess-only-evidence-kit/schema/v0.3.0/evidence-pack.schema.json";
export const SUPPORTED_SCHEMA_VERSIONS = ["0.2.0", "0.3.0"] as const;
