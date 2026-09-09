# Assess-Only Evidence Kit

**UNCLASSIFIED. Fictional sample. Not a real ATO, not CUI, not connected to eMASS.**

Assemble an **AO-facing RMF Assess-Only evidence pack** for one AI model lifecycle event (`model_version_bump`). The **hosting platform holds the ATO**. The model is technology below the system level and is **incorporated** into that authorization — it does **not** receive a standalone ATO.

## What you get

1. Fill identity (host ATO reference, model version, hash, event rationale).
2. Walk a 22-item checklist (10 infrastructure / 12 model) seeded from the DoD AI Cybersecurity RM Tailoring Guide (14 Jul 2025, v2) Appendix B themes.
3. Paste evaluations and AO-negotiable performance / drift thresholds.
4. Record residual risk and ConMon hooks (model as a versioned pipeline artifact).
5. Download a zip for the AO/SCA: `status.md`, `host_package.md`, `poam.md`, `poam.csv`, `brief.md`, `pack.md`, `pack.json`, `pack.sha256`, `evidence.sha256`, `gap_report.md`, `schema/`, `/evidence/*`.

The **workbench** is for the assembler. The **zip** is the product. Packs stay in this browser until you download them. Prefer URI pointers over attachments. Never place API keys, weights, or CUI in a pack.

## Protocol (v0.3)

The **pack** is the product. Schema `$id`:

`https://rpsloss.github.io/assess-only-evidence-kit/schema/v0.3.0/evidence-pack.schema.json`

See [PROTOCOL.md](./PROTOCOL.md), [docs/ROADMAP.md](./docs/ROADMAP.md), [SECURITY.md](./SECURITY.md), and the CI recipe in [docs/ci/](./docs/ci/).

```bash
npm test
npm run ao-pack -- hash examples/model-bump-v1/prior-1.2.0.pack.json
npm run ao-pack -- verify examples/model-bump-v1/pack.json
npm run ao-pack -- inspect examples/model-bump-v1/pack.json
npm run ao-pack -- status examples/model-bump-v1/pack.json
npm run ao-pack -- poam examples/model-bump-v1/pack.json
npm run ao-pack -- host examples/model-bump-v1/pack.json
npm run ao-pack -- brief examples/model-bump-v1/pack.json examples/model-bump-v1/prior-1.2.0.pack.json
npm run ao-pack -- zip examples/model-bump-v1/pack.json -o /tmp/sample.zip
npm run ao-pack -- verify /tmp/sample.zip
npm run ao-pack -- diff examples/model-bump-v1/prior-1.2.0.pack.json examples/model-bump-v1/pack.json
npm run ao-pack -- chain examples/model-bump-v1/prior-1.2.0.pack.json examples/model-bump-v1/pack.json
```

A successor pack must set `chain.prior_pack_hash` to the canonical SHA-256 of the previous `pack.json`. `ao-pack seal` writes that link. `ao-pack zip` writes `pack.sha256` and `evidence.sha256`.

## Doctrine (public)

- DoD Artificial Intelligence Cybersecurity Risk Management Tailoring Guide, 14 July 2025, Version 2.
- DoDI 8510.01 — technologies below the system level use Assess Only.
- DoD CIO cATO / DevSecOps continuous authorization guidance.
- NIST AI RMF 1.0; forthcoming COSAIS overlays (checklist `req_id`s are overlay-ready).
- OMB M-22-18 SBOM, as cited by the Tailoring Guide for Assess-Only evidence.

Exact Appendix B table row IDs are marked `PDF-TBD`. This kit does not grant ATOs, write to eMASS, or cover DoDD 3000.09 weapons-autonomy reviews. Reciprocity applies only where Component policy allows. No real customer, contract, or ATO names.

## Sample

`examples/model-bump-v1/` is a sanitized supervised document-routing classifier bump (`doc-route-clf` 1.2.0 → 1.3.0) on a placeholder host enclave. Open it from the home screen as **Open sample**.

## Layout

```
docs/std.md                         living STD (v0.2)
docs/policy-map.md                  Tailoring Guide ↔ req_ids
docs/ROADMAP.md                     what to add (and what not to)
schema/v0.3.0/evidence-pack.schema.json
PROTOCOL.md                         pack format + hash + zip + verify
bin/ao-pack.mjs                     protocol CLI
examples/model-bump-v1/
examples/conformance/               expected verify failures
src/lib/checklist.ts                overlay-ready items
src/lib/export.ts                   zip + markdown
src/components/pack-editor.tsx      assembler workbench
src/routes/                         home + pack pages
```

## Assembler workbench

```bash
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). Create a pack or **Open sample**, walk the status board (present / partial / gapped / unfinished), then **Download pack for AO/SCA**. The server binds loopback only. No login, no database, no API keys.

`ao-pack` is the same product from the command line if you already have `pack.json`.
