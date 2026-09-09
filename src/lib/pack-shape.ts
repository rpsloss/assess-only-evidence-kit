import { z } from "zod";
import {
  AO_DECISIONS,
  AUTHOR_ROLES,
  EVENT_TYPES,
  ITEM_STATUSES,
  SUPPORTED_SCHEMA_VERSIONS,
} from "./types";

type ShapeFinding = { level: "error"; code: "SCHEMA"; message: string };

const evidenceRef = z
  .object({
    id: z.string().optional(),
    kind: z.enum(["uri", "file"]),
    value: z.string(),
    note: z.string().optional(),
  })
  .strict();

const item = z
  .object({
    req_id: z.string().min(1),
    status: z.enum(ITEM_STATUSES),
    evidence_refs: z.array(evidenceRef).optional(),
    notes: z.string().optional(),
  })
  .strict();

const evaluation = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    dataset_ref: z.string().optional(),
    metrics: z.record(z.string(), z.string()).optional(),
    passed: z.union([z.boolean(), z.null()]).optional(),
    raw_artifact_uri: z.string().optional(),
  })
  .strict();

const performance = z
  .object({
    metric: z.string().optional(),
    operator: z.string().optional(),
    value: z.string().optional(),
    unit: z.string().optional(),
  })
  .strict();

const drift = z
  .object({
    metric: z.string().optional(),
    operator: z.string().optional(),
    value: z.string().optional(),
    method: z.string().optional(),
  })
  .strict();

const file = z
  .object({
    id: z.string().optional(),
    filename: z.string(),
    mime: z.string().optional(),
    size_bytes: z.number().optional(),
    data_base64: z.string().optional(),
  })
  .strict();

const chain = z
  .object({
    prior_pack_id: z.union([z.string(), z.null()]),
    prior_pack_hash: z.union([z.string().regex(/^(sha256:[a-f0-9]{64})?$/), z.null()]),
  })
  .strict();

const packV03 = z
  .object({
    schema_version: z.literal("0.3.0"),
    pack_id: z.string().min(1),
    revision: z.number().int().min(1),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
    author_role: z.enum(AUTHOR_ROLES),
    author_name: z.string().optional(),
    marking: z.string(),
    system_context: z
      .object({
        system_name: z.string(),
        ato_id_or_ref: z.string(),
        boundary_notes: z.string(),
        environment_notes: z.string().optional(),
      })
      .strict(),
    model: z
      .object({
        name: z.string(),
        task: z.string().optional(),
        prior_version: z.string().optional(),
        version: z.string(),
        artifact_hash: z.string(),
        hash_alg: z.string().optional(),
        training_data_provenance_ref: z.string().optional(),
        catalog_uri: z.string().optional(),
      })
      .strict(),
    event: z
      .object({
        type: z.enum(EVENT_TYPES),
        rationale: z.string(),
        change_summary: z.string().optional(),
      })
      .strict(),
    chain,
    appendix_b_items: z.array(item),
    evaluations: z.array(evaluation),
    thresholds: z
      .object({
        negotiated: z.boolean().optional(),
        performance: z.array(performance),
        drift: z.array(drift),
        reauth_trigger_notes: z.string(),
      })
      .strict(),
    residual_risk: z
      .object({
        statement: z.string(),
        mitigations: z.array(z.string()).optional(),
        ao_decision: z.enum(AO_DECISIONS),
        ao_decision_notes: z.string().optional(),
      })
      .strict(),
    conmon_hooks: z
      .object({
        what_is_monitored: z.string().optional(),
        alert_owner: z.string().optional(),
        log_source_refs: z.array(z.string()).optional(),
        cadence_notes: z.string().optional(),
      })
      .strict(),
    baseline_pack_id: z.union([z.string(), z.null()]).optional(),
    files: z.array(file).optional(),
  })
  .strict();

const packV02 = packV03
  .partial({ chain: true, created_at: true, updated_at: true, revision: true })
  .extend({ schema_version: z.literal("0.2.0") });

/** Runtime check of raw JSON against the published 0.3 / 0.2 shapes. Does not migrate. */
export function validatePackShape(raw: unknown): ShapeFinding[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [{ level: "error", code: "SCHEMA", message: "Pack must be a JSON object." }];
  }
  const rec = raw as Record<string, unknown>;
  const version = rec.schema_version;
  if (typeof version !== "string" || !SUPPORTED_SCHEMA_VERSIONS.includes(version as (typeof SUPPORTED_SCHEMA_VERSIONS)[number])) {
    return [
      {
        level: "error",
        code: "SCHEMA",
        message: `Unsupported schema_version ${JSON.stringify(version)} (expected ${SUPPORTED_SCHEMA_VERSIONS.join(" or ")}).`,
      },
    ];
  }
  const schema = version === "0.2.0" ? packV02 : packV03;
  const result = schema.safeParse(raw);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    level: "error" as const,
    code: "SCHEMA",
    message: `${issue.path.length ? issue.path.join(".") : "(root)"}: ${issue.message}`,
  }));
}
