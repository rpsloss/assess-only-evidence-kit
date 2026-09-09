# Assess-Only Evidence Protocol

**UNCLASSIFIED.** This is not an ATO. The hosting platform holds the authorization. The model is incorporated via RMF Assess Only.

A **pack** is the durable record of one model lifecycle event: what changed, what was tested, what residual risk a human is asked to accept. UIs come and go. The pack is the product.

Current schema: **0.3.0**  
Protocol commands: **0.3.1**  
Canonical `$id`: `https://rpsloss.github.io/assess-only-evidence-kit/schema/v0.3.0/evidence-pack.schema.json`

## Rules

1. Packs MUST NOT contain CUI, classified data, API keys, credentials, or model weights.
2. Prefer URI pointers. Attachments, if any, are unclassified eval summaries and hash manifests.
3. `req_id`s (`INF-*`, `MDL-*`) are stable overlay identifiers. Do not rename them to chase a PDF row number.
4. Genesis packs set `chain.prior_pack_id` and `chain.prior_pack_hash` to `null`.
5. A successor pack MUST set `chain.prior_pack_hash` to the SHA-256 of the **canonical** prior `pack.json`.
6. Published packs are immutable. A new event is a new pack (new `pack_id`), not an overwrite.

## Canonical hash

Hash UTF-8 bytes of `JSON.stringify` with keys sorted recursively (arrays keep order). Omit `files[].data_base64` — file bytes live in `evidence/` of the zip; the hash covers identity metadata only.

Prefix: `sha256:` + 64 lowercase hex chars.

A zip MUST include `pack.sha256` containing that string plus a newline. Verify fails if the file is missing or does not match.

## Zip layout

```
README.txt
pack.md              AO-facing narrative
brief.md             twenty-minute AO read (includes canonical hash)
pack.json            machine record (schema 0.3.0)
pack.sha256          canonical hash of pack.json          (MUST)
evidence.sha256      sha256 of each evidence/* file       (SHOULD)
gap_report.md
schema/evidence-pack.schema.json
evidence/            optional unclassified attachments
```

`evidence.sha256` is a materials list for attachments, not a second pack hash:

```
# sha256 of evidence/* bytes. Not the pack canonical hash.
sha256:<hex>  evidence/hash-manifest.txt
```

Emitters from this kit MUST write STORE (ZIP method 0). Readers MAY reject Deflate.

## Commands

```bash
npm run ao-pack -- hash <pack.json|zip>
npm run ao-pack -- verify <pack.json|zip>
npm run ao-pack -- inspect <pack.json|zip>
npm run ao-pack -- brief <pack.json|zip> [prior]
npm run ao-pack -- zip <pack.json|zip> [-o out.zip]
npm run ao-pack -- seal <prior> <next> [-o out.json]
npm run ao-pack -- diff <prior> <next>
npm run ao-pack -- chain <p1> <p2> [p3...]
```

- **verify** — JSON Schema shape (zod), identity, 22 `req_id`s, marking, chain shape, no keys/weights/CUI marking. For zips: `pack.sha256` match, layout, `evidence.sha256` match.
- **inspect** — hash, completeness, verify, zip layout on one page.
- **zip** — emit a STORE archive with the layout above.
- **seal** — write `chain.prior_pack_hash` from the canonical hash of prior.
- **brief** — twenty-minute AO read (identity, evals, open items, residual risk, optional diff).
- **diff** — field-level changes plus chain validity.
- **chain** — walk an ordered list; each successor must hash-link the previous.

Exit `1` on verify failure, `2` on a broken chain/diff link.

## Compatibility

Emitters MUST write `0.3.0`. Readers MUST accept `0.2.0` and migrate `baseline_pack_id` into `chain.prior_pack_id` with `prior_pack_hash: null`. Verify of a 0.2.0 pack warns `SCHEMA_02`.
