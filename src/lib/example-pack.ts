import { CHECKLIST } from "./checklist";
import { createBlankPack } from "./pack-factory";
import type { ChecklistItemState, EvidenceFile, EvidencePack, ItemStatus } from "./types";
import { nowIso, uid } from "./utils";

export const EXAMPLE_HASH_MANIFEST = `doc-route-clf 1.3.0
algorithm: sha256
digest: 7c9e6679c6c6b71f4e8a0c4a1b9d2e3f0a1b2c3d4e5f67890123456789abcdef
catalog: uri://catalog/models/doc-route-clf/1.3.0
immutable_tag: true
prior: 1.2.0
note: Placeholder hash for the sanitized sample pack. Not a real artifact.
`;

export const EXAMPLE_EVAL_SUMMARY = `doc-route-clf 1.3.0 holdout
dataset: uri://catalog/datasets/doc-route-v3/splits/test
F1=0.91  precision=0.90  recall=0.92  OTHER_precision=0.86
proposed_threshold_F1=0.88  result=pass
AO_negotiated=false
note: Sanitized metrics for the sample pack. Not operational data.
`;

function textFile(filename: string, text: string): EvidenceFile {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return {
    id: uid("file"),
    filename,
    mime: "text/plain",
    size_bytes: bytes.byteLength,
    data_base64: btoa(binary),
  };
}

type ItemFill = { status: ItemStatus; notes: string; uri?: string };

const FILLS: Record<string, ItemFill> = {
  "INF-BND-01": {
    status: "met",
    notes:
      "Host Enclave PLATFORM-ALPHA holds the authorization. This classifier is technology below the system level and is incorporated via Assess Only. Version bump does not expand the authorization boundary.",
    uri: "uri://host/ato/ATO-PLACEHOLDER-2025-0412",
  },
  "INF-AC-01": {
    status: "met",
    notes:
      "Promotion pipeline identity `mlops-promote` is the only principal that can overwrite catalog tags. Weights are not world-readable. Break-glass is ISSM-approved.",
    uri: "uri://host/rbac/model-catalog",
  },
  "INF-AU-01": {
    status: "met",
    notes: "Catalog pull, tag promote, and serving-config change events ship to the host SIEM. Retention follows the host ATO package.",
    uri: "uri://host/siem/model-lifecycle",
  },
  "INF-CM-01": {
    status: "met",
    notes: "Serving image digest pinned in the release manifest. Unused debug ports remain closed. Change ticket bound to this bump.",
    uri: "uri://host/cm/doc-route-clf-1.3.0",
  },
  "INF-SEG-01": {
    status: "met",
    notes: "No new flows. Training remains on the isolated build enclave; serving stays on the existing inference VLAN.",
  },
  "INF-INT-01": {
    status: "met",
    notes: "sha256 digest recorded in hash-manifest.txt. Catalog tag is immutable.",
    uri: "hash-manifest.txt",
  },
  "INF-SBOM-01": {
    status: "partial",
    notes: "Serving-stack CycloneDX exists. Model-artifact SBOM is a gap pending generator enablement.",
    uri: "uri://host/sbom/serving-stack",
  },
  "INF-MON-01": {
    status: "met",
    notes: "Host ConMon job `clf-runtime` covers availability, CPU/GPU saturation, and 5xx rate. Model treated as a versioned pipeline artifact.",
    uri: "uri://host/conmon/clf-runtime",
  },
  "INF-IR-01": {
    status: "partial",
    notes: "Generic IR playbook exists. Model-specific extraction/evasion tabletop is scheduled, not yet executed.",
  },
  "INF-SR-01": {
    status: "met",
    notes: "Runtime and accelerator suppliers are inherited from the host SCRM package. No new third-party weights.",
  },
  "MDL-ID-01": {
    status: "met",
    notes: "doc-route-clf 1.2.0 → 1.3.0. Artifact hash in pack identity and hash-manifest.txt.",
    uri: "hash-manifest.txt",
  },
  "MDL-PROV-01": {
    status: "met",
    notes: "Training set is the internal document-routing corpus v3. Data card and dataset hash are in the catalog. No raw training data in this pack.",
    uri: "uri://catalog/datasets/doc-route-v3/data-card",
  },
  "MDL-POIS-01": {
    status: "partial",
    notes: "Dataset pinned. Intake review exists. Canary/holdout against label-flip is documented as a residual gap.",
  },
  "MDL-EVAL-01": {
    status: "met",
    notes: "Holdout F1 0.91 against proposed F1 >= 0.88. AO has not yet accepted the threshold. See eval-holdout-v13.txt.",
    uri: "eval-holdout-v13.txt",
  },
  "MDL-DRIFT-01": {
    status: "partial",
    notes: "Proposed PSI <= 0.2 and F1 >= 0.88. Marked not-negotiated. Re-assess trigger: two consecutive weekly jobs below F1 0.88.",
  },
  "MDL-ADV-01": {
    status: "gap",
    notes: "No adversarial/evasion suite was run for 1.3.0. Residual risk recorded for AO review.",
  },
  "MDL-EXT-01": {
    status: "gap",
    notes: "Inference API is internal-only with rate limits, but extraction/inversion tests were not performed.",
  },
  "MDL-CFG-01": {
    status: "met",
    notes: "Preprocessor and decision threshold pinned in the serving config manifest for 1.3.0.",
    uri: "uri://host/cm/doc-route-clf-1.3.0/serving.json",
  },
  "MDL-REPO-01": {
    status: "met",
    notes: "Stored in the host model catalog, not a share drive.",
    uri: "uri://catalog/models/doc-route-clf/1.3.0",
  },
  "MDL-PII-01": {
    status: "na",
    notes: "Document-routing corpus is business records without PII by data-card assertion. N/A with documented no-PII statement.",
  },
  "MDL-OUT-01": {
    status: "partial",
    notes: "Responses are class labels plus confidence only. No free-text generation. Additional output-filter monitor not yet wired.",
  },
  "MDL-PKG-01": {
    status: "partial",
    notes:
      "This pack is the Assess-Only body of evidence for the bump. It is not an ATO. Host ISSM will attach the zip to the authorization package if the AO accepts residual risk.",
  },
};

function exampleItems(): ChecklistItemState[] {
  return CHECKLIST.map((def) => {
    const fill = FILLS[def.req_id];
    const refs = fill?.uri
      ? [
          {
            id: uid("ref"),
            kind: (fill.uri.endsWith(".txt") ? "file" : "uri") as "file" | "uri",
            value: fill.uri,
            note: "",
          },
        ]
      : [];
    return {
      req_id: def.req_id,
      status: fill?.status ?? "pending",
      notes: fill?.notes ?? "",
      evidence_refs: refs,
    };
  });
}

export function buildExamplePack(): EvidencePack {
  const ts = nowIso();
  const pack = createBlankPack();
  pack.pack_id = "pck_sample_doc_route_clf_130";
  pack.created_at = ts;
  pack.updated_at = ts;
  pack.author_role = "cybersecurity_engineer";
  pack.author_name = "Sample operator";
  pack.marking = "UNCLASSIFIED";
  pack.system_context = {
    system_name: "Host Enclave PLATFORM-ALPHA (placeholder)",
    ato_id_or_ref: "ATO-PLACEHOLDER-2025-0412",
    boundary_notes:
      "Authorization boundary is the host enclave. The classifier is incorporated as technology below the system level. This pack is not an ATO.",
    environment_notes: "Placeholder IL/enclave. Sanitized. No real customer or contract names.",
  };
  pack.model = {
    name: "doc-route-clf",
    task: "supervised_classifier",
    prior_version: "1.2.0",
    version: "1.3.0",
    artifact_hash: "7c9e6679c6c6b71f4e8a0c4a1b9d2e3f0a1b2c3d4e5f67890123456789abcdef",
    hash_alg: "sha256",
    training_data_provenance_ref: "uri://catalog/datasets/doc-route-v3/data-card",
    catalog_uri: "uri://catalog/models/doc-route-clf/1.3.0",
  };
  pack.event = {
    type: "model_version_bump",
    rationale:
      "Retrain on corpus v3 to improve OTHER-class precision. No serving-stack change. No boundary expansion.",
    change_summary: "New weights 1.3.0; preprocessor unchanged; proposed F1 threshold 0.88 (not yet AO-accepted).",
  };
  pack.appendix_b_items = exampleItems();
  pack.evaluations = [
    {
      id: uid("eval"),
      name: "Holdout v3 test split",
      dataset_ref: "uri://catalog/datasets/doc-route-v3/splits/test",
      metrics: { F1: "0.91", precision: "0.90", recall: "0.92", OTHER_precision: "0.86" },
      passed: true,
      raw_artifact_uri: "eval-holdout-v13.txt",
    },
  ];
  pack.thresholds = {
    negotiated: false,
    performance: [
      { metric: "F1", operator: ">=", value: "0.88", unit: "" },
      { metric: "precision", operator: ">=", value: "0.86", unit: "" },
    ],
    drift: [{ metric: "PSI", operator: "<=", value: "0.2", method: "population_stability_index" }],
    reauth_trigger_notes:
      "Two consecutive weekly holdout jobs below F1 0.88, or a serving-stack change, triggers re-assess of this pack.",
  };
  pack.residual_risk = {
    statement:
      "Primary residual risk is unevaluated evasion and extraction against an internal-only classifier API. SBOM for the model artifact is incomplete. Thresholds are proposed, not AO-accepted. This pack does not grant authorization.",
    mitigations: [
      "Keep inference on the existing internal VLAN with rate limits.",
      "Schedule evasion/extraction tests before expanding the interface.",
      "Complete model-artifact SBOM on the next bump.",
    ],
    ao_decision: "pending",
    ao_decision_notes: "",
  };
  pack.conmon_hooks = {
    what_is_monitored: "Availability, 5xx, resource saturation, weekly holdout F1, PSI on incoming document mix.",
    alert_owner: "Host ISSM / MLOps on-call (placeholder roles)",
    log_source_refs: ["uri://host/siem/model-lifecycle", "uri://host/conmon/clf-runtime"],
    cadence_notes: "Runtime alerts continuous; holdout job weekly; PSI weekly.",
  };
  pack.chain = { prior_pack_id: "pck_sample_doc_route_clf_120", prior_pack_hash: null };
  pack.baseline_pack_id = "pck_sample_doc_route_clf_120";
  pack.files = [
    { id: uid("file"), filename: "hash-manifest.txt", mime: "text/plain", size_bytes: 0, data_base64: "" },
    { id: uid("file"), filename: "eval-holdout-v13.txt", mime: "text/plain", size_bytes: 0, data_base64: "" },
  ];
  return pack;
}

export function buildExamplePriorPack(): EvidencePack {
  const pack = buildExamplePack();
  pack.pack_id = "pck_sample_doc_route_clf_120";
  pack.model = {
    ...pack.model,
    prior_version: "1.1.0",
    version: "1.2.0",
    artifact_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    catalog_uri: "uri://catalog/models/doc-route-clf/1.2.0",
  };
  pack.event = {
    type: "model_version_bump",
    rationale: "Genesis sample for 1.2.0. Unclassified placeholder.",
    change_summary: "Initial Assess-Only pack in this chain.",
  };
  pack.evaluations = [
    {
      id: "eval_prior_holdout",
      name: "Holdout v2 test split",
      dataset_ref: "uri://catalog/datasets/doc-route-v2/splits/test",
      metrics: { F1: "0.87", precision: "0.85", recall: "0.89" },
      passed: true,
      raw_artifact_uri: "eval-holdout-v12.txt",
    },
  ];
  pack.chain = { prior_pack_id: null, prior_pack_hash: null };
  pack.baseline_pack_id = null;
  return pack;
}

export function hydrateExampleFiles(pack: EvidencePack): EvidencePack {
  const next = structuredClone(pack);
  const byName: Record<string, string> = {
    "hash-manifest.txt": EXAMPLE_HASH_MANIFEST,
    "eval-holdout-v13.txt": EXAMPLE_EVAL_SUMMARY,
  };
  next.files = next.files.map((file) => {
    if (file.data_base64) return file;
    const text = byName[file.filename];
    if (!text) return file;
    return textFile(file.filename, text);
  });
  const have = new Set(next.files.map((f) => f.filename));
  for (const [filename, text] of Object.entries(byName)) {
    if (!have.has(filename)) next.files.push(textFile(filename, text));
  }
  return next;
}
