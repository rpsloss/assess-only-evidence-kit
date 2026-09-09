# Sample pack — supervised classifier v1.2 → v1.3

Sanitized, generic, **UNCLASSIFIED**. No real organization, contract, or ATO names.

- Host: `Host Enclave PLATFORM-ALPHA (placeholder)`
- ATO ref: `ATO-PLACEHOLDER-2025-0412`
- Model: `doc-route-clf` (supervised document-routing classifier)
- Event: `model_version_bump` 1.2.0 → 1.3.0

Open this pack from the kit home screen (**Open sample**) to walk a realistic Assess-Only bundle: mixed met / partial / gap / n/a, proposed (not AO-accepted) thresholds, and a residual-risk statement that does **not** claim authorization.

Known-good canonical hashes (schema 0.3.0):

- `prior-1.2.0.pack.json` — `sha256:f85561b3373b60d1330f6dce6f693947fd5ff38db5e15529ef76728456f6920c`
- `pack.json` (1.3.0) — `sha256:c86628510825f2764ddcbe0fe9ed8be66e7f3f9ad7932471d9c0a1ee7ccb83ad`

`pack.json` is the machine record. Emit a review zip with:

```bash
npm run ao-pack -- zip examples/model-bump-v1/pack.json -o /tmp/doc-route-clf-1.3.0.zip
npm run ao-pack -- inspect /tmp/doc-route-clf-1.3.0.zip
```
