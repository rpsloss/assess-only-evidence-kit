# Conformance fixtures

Tiny **UNCLASSIFIED** packs used by `npm test` to lock verify failure modes. They are not AO-ready.

- `extra-field.json` — unknown top-level key (`SCHEMA`)
- `banned-marking.json` — marking is not UNCLASSIFIED (`MARKING_BANNED`)
- `unsealed.json` — successor with prior id and no hash (`CHAIN_UNSEALED`)
- `pem-in-notes.json` — private-key marker in notes (`PEM_KEY`)
- `weights-filename.json` — `.safetensors` attachment name (`WEIGHTS`)
