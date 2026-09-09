# System Technical Design — AI Assess-Only Evidence Kit (v0.2)

**Owner:** open sample / portfolio build  
**Audience:** Forward-deployed engineer / ISSM-facing tooling  
**Status:** v0.2 — recommended defaults filled; implemented as a local web kit  
**Policy anchors (public):** DoD AI Cybersecurity Risk Management Tailoring Guide (14 Jul 2025, v2); DoDI 8510.01 RMF; DoD cATO / DevSecOps continuous authorization guidance; NIST AI RMF (AI 100-1); forthcoming NIST SP 800-53 COSAIS overlays (predictive / generative / agent / multi-agent / AI developer env)

---

## 1. Problem statement

AI models do **not** receive standalone ATOs. Under the DoD AI Cybersecurity RM Tailoring Guide, models are handled via an **RMF Assess Only** construct and incorporated into the **hosting platform / system** authorization boundary. Program teams still lack a repeatable, AO-negotiable **evidence pack** for model lifecycle events (new model, version bump, retrain, threshold breach).

**Outcome this system delivers:** For a single model lifecycle event, produce an AO-ready Assess-Only evidence bundle mapped to Tailoring Guide Appendix B themes (infrastructure layer + AI model layer), with explicit drift / performance thresholds the AO can accept or reject.

**Non-goals (v0):** Full eMASS integration; inventing a parallel “model ATO”; weapons autonomy (DoDD 3000.09) workflows; customer-named deployments.

---

## 2. Who pays / buyer category (no named customers)

- Primes and program offices fielding models on **already-authorized** platforms  
- ISSM / ISSO / cybersecurity engineering shops supporting AI-enabled systems under Assess Only  
- Software Pathway / DevSecOps teams seeking evidence that composes with **cATO** continuous monitoring (model as pipeline artifact)

---

## 3. Users & jobs-to-be-done

| Actor | Job |
|--------|-----|
| Cybersecurity engineer / ISSM | Assemble Assess-Only evidence for a model change without reinventing the checklist |
| Model / MLOps owner | Attach eval results, version IDs, monitoring thresholds in a standard shape |
| AO / SCA (consumer) | Review one coherent pack: what changed, what was tested, residual risk, ConMon hooks |

---

## 4. Scope — v0 (2-week slice) — implemented

**In:**
1. Checklist generator from Tailoring Guide Appendix B–style requirement buckets (infra + model)  
2. Evidence pack schema (JSON + human markdown export) for **one** event type: `model_version_bump`  
3. Threshold stub: performance + data-drift fields the AO negotiates once  
4. Local web form / CLI: fill → emit zip (`pack.md`, `brief.md`, `pack.json`, `pack.sha256`, `evidence.sha256`, `gap_report.md`, `/evidence`, schema)

**Out:** Multi-tenant SaaS, eMASS API write, classified networks, automated model eval runners, multi-agent / MCP-specific overlays (note as future)

---

## 5. Conceptual architecture

```
[Event input] → [Pack builder] → [Evidence store (browser localStorage)] → [Exports]
     │                │                    │                  ├─ pack.md (AO-facing)
     │                │                    │                  ├─ pack.json (machine)
     │                ├─ Checklist engine   │                  ├─ gap_report.md
     │                │   (Appendix B map)  │                  ├─ schema/evidence-pack.schema.json
     │                └─ Threshold registry │                  └─ evidence/*
     └─ Model metadata (version, hash, eval refs)
```

**Trust boundary:** Operator workstation. No model weights required — hashes + eval artifact pointers only. Packs never leave the browser unless the operator downloads the zip.

---

## 6. Open questions — recommended defaults (v0.2)

| # | Question | Default | Assumption |
|---|----------|---------|------------|
| 1 | CLI vs local web vs markdown templates | **Local web form** with zip export | Air-gap artifact is the zip; CLI deferred. Templates are generated, not hand-edited. |
| 2 | Checklist depth | **22 overlay-ready `req_id`s** (10 infra / 12 model) mapped to public themes | Exact Appendix B *row* IDs marked `PDF-TBD` until PDF parse. |
| 3 | Evidence storage | **URI pointers + optional in-pack attachments** (≤400 KB) | No S3/SharePoint SDK. Operator pastes those URIs as strings. |
| 4 | IL / marking | **UNCLASSIFIED banner** + operator-supplied `marking` field | Kit never generates CUI/FOUO content. FOUO is a marking the operator may type; example pack is UNCLASSIFIED. |

---

## 7. Core data model

See `schema/evidence-pack.schema.json` (`schema_version: 0.2.0`).

Working status `pending` is allowed on drafts; gap reports treat `pending` as unmet. Export-ready = identity complete + every item assessed + residual-risk statement present.

---

## 8. Functional requirements (v0.2 status)

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | Create pack for `model_version_bump` with required fields validated | Done |
| FR-2 | Checklist covering infra + model buckets (seeded from public guide themes; exact table IDs PDF-TBD) | Done (22 items) |
| FR-3 | Mark each item met / partial / gap / n/a with evidence URI or attachment | Done |
| FR-4 | Export `pack.md` + `pack.json` + `gap_report.md` | Done (zip + singles) |
| FR-5 | Capture AO threshold negotiation fields (blank template allowed) | Done |
| FR-6 | Import prior pack as baseline for next bump (diff of model version + gaps) | Done (P1 pulled in) |
| FR-7 | Optional mapping notes to NIST AI RMF Govern/Map/Measure/Manage | Done (per item + policy map) |

---

## 9. Non-functional requirements

- Offline-capable (air-gap friendly zip; no network required after page load except optional webfonts)  
- No invented compliance claims — UI labels cite “Tailoring Guide / Assess Only,” not “ATO granted”  
- Auditability: pack JSON is versioned (`pack_id` + `revision`); revision increments on zip export  
- Secrets: never embed API keys, weights, or CUI beyond operator-supplied placeholders  

---

## 10. Security & compliance notes (build constraints)

- Align language with: platform ATO + model Assess Only; reciprocity only where Component policy allows  
- Compose with cATO story: treat model as **versioned pipeline artifact** with ConMon hooks, not a separate accreditation system  
- Explicitly out of scope: DoDD 3000.09 autonomous weapons reviews  
- COSAIS overlays (NIST): checklist is **overlay-ready** (stable `req_id`s) so future generative / agent overlays can plug in  

---

## 11. Acceptance criteria

- [x] Operator can produce a complete pack for a fictional-but-generic “supervised classifier v1.2 → v1.3” bump (sample pack included)  
- [x] Gap report lists every unmet Appendix-B-seeded item  
- [x] Exports open offline; JSON matches schema  
- [x] README / policy map cite public policy sources; no fake customer names  

---

## 12. Sources (public)

- DoD AI Cybersecurity Risk Management Tailoring Guide (14 Jul 2025, v2) — Assess Only; Appendix B infrastructure layer + AI model layer  
- DoDI 8510.01 — technologies below the system level use Assess Only  
- DoD CIO Continuous Authorization / DevSecOps cATO implementation & evaluation criteria  
- DoD CTO Developmental T&E of AI-Enabled Systems Guidebook (Feb 2025)  
- DoD CTO Machine Learning System Safety Engineering Guide (Jan 2026) — adjacent; not core of v0  
- NIST AI RMF 1.0; NIST COSAIS overlay track (concept / outlines through 2026)  
- OMB M-22-18 (SBOM), as cited by the Tailoring Guide for Assess-Only evidence  
