import type { ChecklistDef } from "./types";

/**
 * Overlay-ready Assess-Only checklist (v0.2).
 *
 * Seeded from public themes in the DoD AI Cybersecurity Risk Management
 * Tailoring Guide (14 Jul 2025, v2) — especially Section 3 lifecycle
 * activities and Appendix B tables 1-2 / 2-2 / 3-2 / 4-2 (infrastructure
 * layer vs AI model layer). Exact Appendix B table *row* IDs are not
 * asserted here; they need PDF confirmation (`pdf_row_id: PDF-TBD`).
 *
 * These `req_id`s are stable Castleridge overlay identifiers so a future
 * NIST COSAIS overlay (predictive / generative / agent) can plug in
 * without renaming.
 */
export const CHECKLIST: ChecklistDef[] = [
  {
    req_id: "INF-BND-01",
    layer: "infra",
    title: "Host authorization boundary and Assess-Only incorporation",
    prompt:
      "Confirm the hosting platform/system holds the authorization (ATO). The model is technology below the system level and is incorporated via RMF Assess Only — it does not receive a standalone ATO. Record whether this version bump expands the authorization boundary.",
    evidence_hint:
      "Boundary statement, ATO identifier/reference, Assess-Only incorporation note. Do not label this pack as an ATO.",
    theme: "Assess Only construct; models incorporated into host authorization",
    appendix_ref: "Tailoring Guide §3.1.3 / §3.1.5; DoDI 8510.01 Assess Only",
    pdf_row_id: "PDF-TBD",
    controls: ["CA-2", "PM-9", "PM-11"],
    nist_ai_rmf: ["Govern", "Map"],
    threat_refs: [],
  },
  {
    req_id: "INF-AC-01",
    layer: "infra",
    title: "Access control to artifacts, data, and inference administration",
    prompt:
      "Show least-privilege access to model weights, training data, promotion pipelines, and privileged inference/admin interfaces. Identify who can pull, promote, or overwrite this version.",
    evidence_hint:
      "RBAC extract, group membership, break-glass procedure, or pipeline identity list (no secrets).",
    theme: "Access control on infrastructure layer",
    appendix_ref: "App B Tables 2-2 / 3-2 (AC-2, AC-3, AC-6 family)",
    pdf_row_id: "PDF-TBD",
    controls: ["AC-2", "AC-3", "AC-6", "AC-6(9)", "AC-6(10)"],
    nist_ai_rmf: ["Govern", "Manage"],
    threat_refs: ["Unauthorized access", "Broken authentication/access control (3.1.l)"],
  },
  {
    req_id: "INF-AU-01",
    layer: "infra",
    title: "Audit of model access, promotion, and configuration change",
    prompt:
      "Confirm audit records exist for model pull, version promotion, serving-config change, and privileged inference. Identify log destination and retention.",
    evidence_hint:
      "Log-source name, sample event types (redacted), SIEM/rule pointer. No raw CUI logs in this pack.",
    theme: "Auditing of AI system / model lifecycle events",
    appendix_ref: "App B Tables 2-2 / 3-2 (AU-2, AU-6, AU-12); §3.1.3 AU-6",
    pdf_row_id: "PDF-TBD",
    controls: ["AU-2", "AU-3", "AU-6", "AU-12"],
    nist_ai_rmf: ["Measure", "Manage"],
    threat_refs: ["Unauthorized access", "Misconfiguration (3.1.m)"],
  },
  {
    req_id: "INF-CM-01",
    layer: "infra",
    title: "Serving-stack configuration and least functionality",
    prompt:
      "Identify the runtime that serves this version (container image digest, runtime flags, disabled unused ports/features). Confirm change control on the serving stack matches the model version.",
    evidence_hint:
      "Image digest, Helm/manifest URI, Container Platform SRG alignment note, CM ticket.",
    theme: "Configuration control of the operations environment",
    appendix_ref: "App B CM-7; §3.1.3 Container Platform SRG; §3.1.5 config control",
    pdf_row_id: "PDF-TBD",
    controls: ["CM-7", "CM-3", "CM-8"],
    nist_ai_rmf: ["Map", "Manage"],
    threat_refs: ["Improper configuration", "Misconfiguration (3.1.m)"],
  },
  {
    req_id: "INF-SEG-01",
    layer: "infra",
    title: "Segmentation of training and serving environments",
    prompt:
      "Describe network / information-flow enforcement between training, catalog, and serving. Note air-gap or IL enclave constraints if used. Confirm this bump does not punch a new flow.",
    evidence_hint:
      "Data-flow diagram URI, firewall/allow-list change record, or statement of no new flows.",
    theme: "Information flow enforcement; air-gap / segmentation of training",
    appendix_ref: "App B AC-4; §3.1.3 air-gapping / network segmentation",
    pdf_row_id: "PDF-TBD",
    controls: ["AC-4", "SC-7", "AC-17"],
    nist_ai_rmf: ["Map", "Govern"],
    threat_refs: ["Data access attacks", "Exfiltration via inference API (3.1.b)"],
  },
  {
    req_id: "INF-INT-01",
    layer: "infra",
    title: "Integrity of stored model artifacts",
    prompt:
      "Record cryptographic hash (and signature if used) of the promoted artifact. Confirm write-once or immutable catalog storage and that v1.x cannot be silently overwritten.",
    evidence_hint:
      "sha256/sha512 digest, signature URI, registry immutability setting.",
    theme: "Software / model integrity checks",
    appendix_ref: "§3.1.3 SI-7; App B SI-7",
    pdf_row_id: "PDF-TBD",
    controls: ["SI-7", "SC-13", "AU-10"],
    nist_ai_rmf: ["Measure", "Manage"],
    threat_refs: ["Logic corruption", "Erode model integrity (3.1.h)"],
  },
  {
    req_id: "INF-SBOM-01",
    layer: "infra",
    title: "SBOM / component inventory for serving stack and model",
    prompt:
      "Attach or point to an SBOM covering the serving stack and, when applicable, the model artifact and third-party weights. Assess-Only evidence should include an SBOM consistent with OMB M-22-18.",
    evidence_hint:
      "CycloneDX/SPDX URI, generator, timestamp. No proprietary component secrets.",
    theme: "SBOM as Assess-Only evidence; component inventory",
    appendix_ref: "§3.1.3 OMB M-22-18 SBOM; App B CM-8",
    pdf_row_id: "PDF-TBD",
    controls: ["CM-8", "SA-4", "SR-4"],
    nist_ai_rmf: ["Map", "Govern"],
    threat_refs: ["Supply chain", "Intellectual property theft (3.1.i)"],
  },
  {
    req_id: "INF-MON-01",
    layer: "infra",
    title: "Platform continuous monitoring covers model runtime",
    prompt:
      "Show how host-platform ConMon (cATO continuous monitoring, if applicable) includes this model as a versioned pipeline artifact: health, availability, resource exhaustion, and chaff/DoS signals.",
    evidence_hint:
      "Monitor name, dashboard URI, alert route. Model treated as artifact — not a separate accreditation system.",
    theme: "Continuous monitoring of infrastructure layer; cATO composition",
    appendix_ref: "App B Table 4-2 CA-7 / CA-7(3) / RA-5; DoD cATO guidance",
    pdf_row_id: "PDF-TBD",
    controls: ["CA-7", "CA-7(3)", "RA-5", "SI-4"],
    nist_ai_rmf: ["Measure", "Manage"],
    threat_refs: [
      "Denial of service (3.1.f)",
      "Spamming with chaff data (3.1.g / 4.1.b)",
      "Cost harvesting (4.1.c)",
    ],
  },
  {
    req_id: "INF-IR-01",
    layer: "infra",
    title: "Incident monitoring for model-specific events",
    prompt:
      "Confirm IR playbooks cover model-specific events (poisoning suspicion, evasion campaign, extraction attempt, integrity mismatch) and name the alert owner.",
    evidence_hint:
      "Playbook URI, on-call role, last tabletop date. No classified incident detail.",
    theme: "Incident monitoring of AI models in operations",
    appendix_ref: "App B Table 4-2 IR-5; Table 4-1 monitoring threat vectors",
    pdf_row_id: "PDF-TBD",
    controls: ["IR-5", "IR-4", "IR-6"],
    nist_ai_rmf: ["Manage"],
    threat_refs: ["Evade ML model (4.1.a)", "Erode model integrity (3.1.h)"],
  },
  {
    req_id: "INF-SR-01",
    layer: "infra",
    title: "Supply-chain assessment of hosting and serving components",
    prompt:
      "Identify third-party runtime, accelerators, and model-catalog components used by this bump. Note supplier assessment or inherited platform SCRM coverage.",
    evidence_hint:
      "Supplier list (names only), inherited SCRM statement, or SA/SR package URI.",
    theme: "Supply chain risk for infrastructure layer",
    appendix_ref: "App B SR-2 / SR-3 / SR-6; RA-3(1)",
    pdf_row_id: "PDF-TBD",
    controls: ["SR-2", "SR-3", "SR-6", "RA-3(1)"],
    nist_ai_rmf: ["Govern", "Map"],
    threat_refs: ["Supply chain", "Train proxy / replicate model (3.1.t / 3.1.u)"],
  },
  {
    req_id: "MDL-ID-01",
    layer: "model",
    title: "Model identity, version, hash, and lineage",
    prompt:
      "Bind this event to a unique model name, prior version, new version, and artifact hash. Assess-Only evidence must include change-management documentation for the bump.",
    evidence_hint:
      "Catalog entry, git/tag, hash manifest, change ticket.",
    theme: "Change management documentation as Assess-Only evidence",
    appendix_ref: "Tailoring Guide exec summary (change management); §3.1.3",
    pdf_row_id: "PDF-TBD",
    controls: ["CM-3", "SI-7", "SA-4"],
    nist_ai_rmf: ["Map", "Govern"],
    threat_refs: ["Continue training after deployment (3.1.n)"],
  },
  {
    req_id: "MDL-PROV-01",
    layer: "model",
    title: "Training-data provenance and integrity",
    prompt:
      "Point to a data card or provenance record covering collection, licensing, classification/sensitivity, and integrity of the training/fine-tune set used for this version.",
    evidence_hint:
      "Data-card URI, dataset hash, steward role. No raw training data in this pack.",
    theme: "Provenance (SR-4); data cards; data security in model development",
    appendix_ref: "App B SR-4 / SR-4(3); §3.1.3 data security / RAI Toolkit",
    pdf_row_id: "PDF-TBD",
    controls: ["SR-4", "SR-4(3)", "SI-12"],
    nist_ai_rmf: ["Map", "Govern"],
    threat_refs: ["Infer training data membership (3.1.w)", "Data injection"],
  },
  {
    req_id: "MDL-POIS-01",
    layer: "model",
    title: "Poisoning / injection / label-manipulation controls",
    prompt:
      "Describe controls against training-data injection, label manipulation, and logic corruption for this bump (intake review, canary/holdout, dataset pinning).",
    evidence_hint:
      "Intake checklist, pinning hash, canary result URI.",
    theme: "Model poisoning (data injection, data manipulation, logic corruption)",
    appendix_ref: "App B Table 2-1 Model Poisoning; §3.1.3 adversary injections / backdoors",
    pdf_row_id: "PDF-TBD",
    controls: ["SI-7", "SI-10", "SA-11(1)", "SR-8"],
    nist_ai_rmf: ["Map", "Measure"],
    threat_refs: ["Model poisoning", "Injection attacks (3.1.k)"],
  },
  {
    req_id: "MDL-EVAL-01",
    layer: "model",
    title: "T&E against accepted performance parameters",
    prompt:
      "Attach evaluation results on a declared dataset against AO-accepted parameters (or proposed parameters if not yet negotiated). Record pass/fail. T&E results are required Assess-Only evidence.",
    evidence_hint:
      "Metrics table, dataset_ref, eval artifact URI. See Evaluations step.",
    theme: "T&E / V&V informing Assess and Incorporate",
    appendix_ref: "§3.1.3 DoDI 5000.89, RAI Toolkit, T&E results as Assess-Only evidence",
    pdf_row_id: "PDF-TBD",
    controls: ["CA-2", "SA-11", "SI-6"],
    nist_ai_rmf: ["Measure"],
    threat_refs: ["Evasion attacks (3.1.e)"],
  },
  {
    req_id: "MDL-DRIFT-01",
    layer: "model",
    title: "Drift and performance thresholds (AO-negotiated)",
    prompt:
      "State performance and data-drift thresholds the AO can accept or reject, plus the re-authorization / re-assess trigger if they are breached. Blank template is allowed in v0; gaps must be explicit.",
    evidence_hint:
      "Threshold registry fields in this pack; monitor job URI.",
    theme: "Risk monitoring of the AI model; ConMon hooks",
    appendix_ref: "App B Table 4-2 CA-7(4); FR-5 threshold stub",
    pdf_row_id: "PDF-TBD",
    controls: ["CA-7(4)", "SI-4", "RA-3"],
    nist_ai_rmf: ["Measure", "Manage"],
    threat_refs: ["Erode model integrity (3.1.h)", "Continue training after deployment (3.1.n)"],
  },
  {
    req_id: "MDL-ADV-01",
    layer: "model",
    title: "Evasion / adversarial evaluation",
    prompt:
      "Record whether this version was evaluated against evasion / adversarial examples relevant to the task, and the residual risk if testing is partial.",
    evidence_hint:
      "Attack types, dataset, fail rate, artifact URI.",
    theme: "Evasion attacks against deployed models",
    appendix_ref: "App B Table 3-1 3.1.e Evade Model; Table 4-1 4.1.a",
    pdf_row_id: "PDF-TBD",
    controls: ["SI-10", "SI-10(3)", "CA-8"],
    nist_ai_rmf: ["Measure"],
    threat_refs: ["Evasion attacks (3.1.e)", "Evade ML model (4.1.a)"],
  },
  {
    req_id: "MDL-EXT-01",
    layer: "model",
    title: "Extraction, inversion, and membership-inference residual risk",
    prompt:
      "Assess residual risk of model extraction, inversion, and membership inference given the serving interface (API rate limits, output filtering, query logging). Mark gap if untested.",
    evidence_hint:
      "Interface description, rate-limit policy URI, test result or explicit gap.",
    theme: "Inference-API abuse and model confidentiality",
    appendix_ref: "App B Table 3-1 3.1.c Extract / 3.1.d Invert / 3.1.w membership",
    pdf_row_id: "PDF-TBD",
    controls: ["AC-4", "SI-15", "AU-13"],
    nist_ai_rmf: ["Map", "Measure"],
    threat_refs: [
      "Extract model (3.1.c)",
      "Invert model (3.1.d)",
      "Infer training data membership (3.1.w)",
      "Train proxy model (3.1.t)",
    ],
  },
  {
    req_id: "MDL-CFG-01",
    layer: "model",
    title: "Serving configuration and hyperparameter change control",
    prompt:
      "Show that serving configuration (batch, temperature/threshold, preprocessor versions) is under change control and pinned to this model version.",
    evidence_hint:
      "Config manifest URI, diff vs prior version.",
    theme: "Improper configuration of algorithms or models",
    appendix_ref: "App B Table 2-1 Improper Configuration; Table 3-1 3.1.m",
    pdf_row_id: "PDF-TBD",
    controls: ["CM-3", "CM-6", "SI-10(3)"],
    nist_ai_rmf: ["Manage"],
    threat_refs: ["Improper configuration", "Misconfiguration (3.1.m)"],
  },
  {
    req_id: "MDL-REPO-01",
    layer: "model",
    title: "Secure model catalog / repository",
    prompt:
      "Confirm this version is stored in a secure model catalog or repository with access control, integrity, and discoverability — not an ad-hoc share drive.",
    evidence_hint:
      "Catalog URI, path, promotion record.",
    theme: "Secure model catalog for discovery, reuse, and fine-tune",
    appendix_ref: "§3.1.3 secure model catalog or repository",
    pdf_row_id: "PDF-TBD",
    controls: ["CM-8", "AC-3", "SI-7"],
    nist_ai_rmf: ["Govern", "Map"],
    threat_refs: ["Unauthorized access", "Intellectual property theft (3.1.i)"],
  },
  {
    req_id: "MDL-PII-01",
    layer: "model",
    title: "PII minimization in training, evaluation, and retention",
    prompt:
      "State whether training/eval sets contain PII, what was minimized, and retention/disposal of those sets. Mark n/a only with a documented no-PII assertion.",
    evidence_hint:
      "Data-card privacy section, minimization method, disposal note.",
    theme: "Information management and retention for AI models",
    appendix_ref: "App B SI-12 / SI-12(1)(2)(3) (AI Models column)",
    pdf_row_id: "PDF-TBD",
    controls: ["SI-12", "SI-12(1)", "SI-12(2)", "SI-12(3)", "PT-1"],
    nist_ai_rmf: ["Govern", "Map"],
    threat_refs: ["Infer training data membership (3.1.w)"],
  },
  {
    req_id: "MDL-OUT-01",
    layer: "model",
    title: "Output filtering and inference-API exfiltration controls",
    prompt:
      "Describe output filtering, truncation, or monitoring that limits leakage of training data or system internals through the inference API.",
    evidence_hint:
      "Filter spec URI, sample blocked output (synthetic), monitor rule.",
    theme: "Information output filtering; inference-API exfiltration",
    appendix_ref: "App B SI-15; Table 3-1 3.1.b Exfiltration via Inference API",
    pdf_row_id: "PDF-TBD",
    controls: ["SI-15", "AC-4", "AU-13"],
    nist_ai_rmf: ["Measure", "Manage"],
    threat_refs: ["Exfiltration via inference API (3.1.b)", "Discover model ontology (3.1.r)"],
  },
  {
    req_id: "MDL-PKG-01",
    layer: "model",
    title: "Assess-Only evidence packaged for host authorization",
    prompt:
      "Confirm this pack contains (or points to) the Assess-Only body of evidence: cybersecurity assessment results, change-management documentation, acquisitions documentation as applicable, T&E results, and SBOM when applicable. Explicitly: this is not an ATO.",
    evidence_hint:
      "This pack's export (pack.md / pack.json / gap_report.md) plus any eMASS-bound artifact pointer. No eMASS write in v0.",
    theme: "Assess and Incorporate; evidence added to host authorization package",
    appendix_ref: "§3.1.3 Assess and Incorporate; exec summary Assess-Only evidence list",
    pdf_row_id: "PDF-TBD",
    controls: ["CA-2", "CA-6", "PM-9"],
    nist_ai_rmf: ["Govern", "Manage"],
    threat_refs: [],
  },
];

export const CHECKLIST_BY_ID: Record<string, ChecklistDef> = Object.fromEntries(
  CHECKLIST.map((item) => [item.req_id, item]),
);

export function itemsForLayer(layer: ChecklistDef["layer"]): ChecklistDef[] {
  return CHECKLIST.filter((item) => item.layer === layer);
}
