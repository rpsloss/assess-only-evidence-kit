# Policy map — Tailoring Guide themes ↔ checklist IDs

**Guide:** DoD Artificial Intelligence Cybersecurity Risk Management Tailoring Guide, 14 July 2025, Version 2 (UNCLASSIFIED).  
**Appendix B tables (public):** 1-1/1-2 Design & Develop; 2-1/2-2 Development; 3-1/3-2 Deploy & Use; 4-1/4-2 Monitoring. Each security-priority table has **Infrastructure Layer** and **AI Models** columns.

Exact table *row* identifiers are **PDF-TBD**. `req_id`s below are stable overlay IDs (COSAIS-ready). Control IDs are indicative CNSSI 1253 / NIST SP 800-53 families drawn from Appendix B themes, **not** a claim that those controls have been assessed.

Quoted doctrine (paraphrase kept close to public text):

- “AI models do not need an ATO, but the actual system infrastructure layer does.”
- Models complete the Assess Only Construct’s Assess and Incorporate process; evidence (assessment, change management, acquisitions documentation, T&E results, SBOM when applicable) is added to the host authorization package.
- Adding models to an already approved system typically does not require a new system authorization; due diligence under Assess Only is still required.

---

## Infrastructure layer (host holds the ATO)

| req_id | Title | Guide theme | Appendix B / section | Indicative controls | AI RMF |
|--------|-------|-------------|----------------------|---------------------|--------|
| INF-BND-01 | Host authorization boundary and Assess-Only incorporation | Models below-system; incorporate evidence | §3.1.3 / §3.1.5; DoDI 8510.01 | CA-2, PM-9, PM-11 | Govern, Map |
| INF-AC-01 | Access control to artifacts, data, inference admin | Access control on infra | Tables 2-2 / 3-2 AC family | AC-2, AC-3, AC-6 | Govern, Manage |
| INF-AU-01 | Audit of access, promotion, config change | Auditing | Tables 2-2 / 3-2 AU; §3.1.3 AU-6 | AU-2, AU-3, AU-6, AU-12 | Measure, Manage |
| INF-CM-01 | Serving-stack configuration / least functionality | Config control; Container SRG | CM-7; §3.1.3; §3.1.5 | CM-7, CM-3, CM-8 | Map, Manage |
| INF-SEG-01 | Segmentation of training and serving | Flow enforcement; air-gap language | AC-4; §3.1.3 segmentation | AC-4, SC-7, AC-17 | Map, Govern |
| INF-INT-01 | Integrity of stored model artifacts | SI-7 integrity | §3.1.3 SI-7 | SI-7, SC-13, AU-10 | Measure, Manage |
| INF-SBOM-01 | SBOM / component inventory | OMB M-22-18 SBOM as Assess-Only evidence. Point at a CycloneDX ML-BOM or CISA SBOM-for-AI ingredients list; do not embed the BOM in the pack. | §3.1.3; CM-8 | CM-8, SA-4, SR-4 | Map, Govern |
| INF-MON-01 | Platform ConMon covers model runtime | CA-7; cATO composition | Table 4-2 CA-7 / CA-7(3) / RA-5 | CA-7, CA-7(3), RA-5, SI-4 | Measure, Manage |
| INF-IR-01 | Incident monitoring for model-specific events | IR-5; monitoring threat vectors | Table 4-2 IR-5; Table 4-1 | IR-5, IR-4, IR-6 | Manage |
| INF-SR-01 | Supply chain of hosting/serving components | SCRM | SR-2/3/6; RA-3(1) | SR-2, SR-3, SR-6, RA-3(1) | Govern, Map |

## AI model layer (Assess Only)

| req_id | Title | Guide theme | Appendix B / section | Indicative controls | AI RMF |
|--------|-------|-------------|----------------------|---------------------|--------|
| MDL-ID-01 | Identity, version, hash, lineage | Change-management documentation as evidence | Exec summary; §3.1.3 | CM-3, SI-7, SA-4 | Map, Govern |
| MDL-PROV-01 | Training-data provenance | SR-4 provenance; data cards | SR-4 / SR-4(3); §3.1.3 | SR-4, SI-12 | Map, Govern |
| MDL-POIS-01 | Poisoning / injection / label manipulation | Table 2-1 Model Poisoning | Table 2-1; §3.1.3 injections/backdoors | SI-7, SI-10, SA-11(1), SR-8 | Map, Measure |
| MDL-EVAL-01 | T&E against accepted parameters | T&E results as Assess-Only evidence | §3.1.3 DoDI 5000.89, RAI Toolkit | CA-2, SA-11, SI-6 | Measure |
| MDL-DRIFT-01 | Drift & performance thresholds (AO-negotiated) | CA-7(4) risk monitoring | Table 4-2 CA-7(4) | CA-7(4), SI-4, RA-3 | Measure, Manage |
| MDL-ADV-01 | Evasion / adversarial evaluation | Evade Model | Table 3-1 3.1.e; Table 4-1 4.1.a | SI-10, SI-10(3), CA-8 | Measure |
| MDL-EXT-01 | Extraction, inversion, membership inference | Inference-API abuse | Table 3-1 3.1.c / 3.1.d / 3.1.w | AC-4, SI-15, AU-13 | Map, Measure |
| MDL-CFG-01 | Serving config / hyperparameter change control | Improper configuration | Table 2-1; Table 3-1 3.1.m | CM-3, CM-6, SI-10(3) | Manage |
| MDL-REPO-01 | Secure model catalog | Catalog / repository | §3.1.3 | CM-8, AC-3, SI-7 | Govern, Map |
| MDL-PII-01 | PII minimization in train/eval/retention | SI-12 family on AI Models column | SI-12 / SI-12(1)(2)(3) | SI-12, PT-1 | Govern, Map |
| MDL-OUT-01 | Output filtering / inference exfil | SI-15; 3.1.b | SI-15; Table 3-1 3.1.b | SI-15, AC-4, AU-13 | Measure, Manage |
| MDL-PKG-01 | Assess-Only package for host authorization | Assess and Incorporate | §3.1.3; exec summary evidence list | CA-2, CA-6, PM-9 | Govern, Manage |

## Threat vector index (Appendix B Tables 2-1 / 3-1 / 4-1)

Used in item `threat_refs` (not exhaustive): model poisoning (injection / manipulation / logic corruption); unauthorized access; improper configuration; data access / substitute model; inference API access & exfil (3.1.a–b); extract / invert (3.1.c–d); evasion (3.1.e, 4.1.a); DoS / chaff / cost harvesting (3.1.f–g, 4.1.b–c); erode integrity (3.1.h); IP theft (3.1.i); broken authn (3.1.l); misconfiguration (3.1.m); continue training after deploy (3.1.n); train proxy / replicate (3.1.t–u); membership inference (3.1.w).

## Out of scope (explicit)

- DoDD 3000.09 autonomous weapons V&V (mentioned by the Guide as adjacent; this kit does not implement it)
- eMASS write / control inheritance graphs
- Invented ATOs, contracts, or customer names
- Classified / CUI content generation
