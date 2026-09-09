# Protocol changelog

## 0.3.1 (zip + inspect + schema)

- `ao-pack zip` emits a STORE archive with `brief.md`, `pack.sha256`, and `evidence.sha256`.
- `verify` of a zip checks `pack.sha256` against the canonical hash and `evidence.sha256` against attachment bytes.
- `verify` runs a zod shape check on raw JSON (unknown keys, enums, required `chain` on 0.3.0).
- `inspect` prints hash, completeness, verify, and zip layout.
- Conformance fixtures under `examples/conformance/` (schema, marking, unsealed chain, PEM marker, weights filename).
- CI recipe at `docs/ci/protocol.yml`; live workflow at `.github/workflows/protocol.yml`.

## 0.3.0 (commands)

- `verify` — identity, checklist completeness, banned marking, no PEM/keys/weights.
- `seal` — stamp `chain.prior_pack_hash` from a prior pack.
- `brief` — AO twenty-minute read.
- `chain` — walk an ordered list of packs.

## 0.3.0

- Canonical `$id` at GitHub Pages (`…/schema/v0.3.0/evidence-pack.schema.json`).
- Required `chain` object: `prior_pack_id`, `prior_pack_hash` (`sha256:<hex>` or null).
- Canonical hash omits `files[].data_base64`.
- Zip MAY include `pack.sha256`.
- `ao-pack hash` and `ao-pack diff` reference commands.
- `baseline_pack_id` retained as a deprecated alias.

## 0.2.0

- First published pack: identity, event, 22 checklist items, evaluations, thresholds, residual risk, ConMon hooks.
