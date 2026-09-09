# Protocol roadmap

**UNCLASSIFIED.** Research notes for the next decade of this pack format. The pack stays a small, hash-linked JSON record. Adjacent ecosystems are referenced, not forked.

## What this pack is

A pack is an **attestation about a model lifecycle event**, bound to a model artifact by `model.artifact_hash`. It is not the model, not an ATO, and not a software SBOM.

[SLSA](https://slsa.dev/spec/v1.0/distributing-provenance) says attestations SHOULD be bound to artifacts, not to “releases.” That is already the shape here: the event record hashes independently of weights, and points at the artifact digest.

## Do next (compatible)

1. **Assembler workbench, zip for AO/SCA.** One event at a time. `status.md` is present / partial / gapped / unfinished. Do not bury work in a 22-row form.
2. **Keep zip sidecars authoritative.** `pack.sha256` and `evidence.sha256` are the in-toto-style materials list. Do not silently Deflate; STORE keeps bytes obvious.
3. **Conformance fixtures.** `examples/conformance/` locks failure modes. Add more as verify grows.
4. **CI on every push.** `.github/workflows/protocol.yml` (mirrored in `docs/ci/`).
5. **Optional `files[].sha256` in a later schema** so the machine record itself names attachment digests. Until then the zip sidecar is enough and does not require a `$id` bump.

## Do later (new schema or detached files)

- **Detached signatures**, not keys inside the pack. When signing, use an existing envelope ([in-toto / DSSE](https://in-toto.io/), cosign, or Sigstore) over `pack.sha256`. Do not invent a custom signature JSON field.
- **Transparency logs** (Rekor, [SCITT](https://www.ietf.org/archive/id/draft-ietf-scitt-architecture-12.html)) only after packs are signed. Hash-linking history is local; a log is public immutability.
- **CycloneDX ML-BOM / CISA SBOM for AI** as URI pointers (`INF-SBOM-01`), not embedded BOMs. The pack remains AO-facing; the BOM remains an ingredients list.
- **NIST AI RMF / NIST AI 300-1 dataset and model cards** as URI pointers. This pack is the Assess-Only decision record, not a model card.
- **in-toto layout** for the promotion pipeline (who may seal, who may accept residual risk). That is organizational policy, not pack JSON.

## Non-goals

- eMASS write-back, CUI, weights, live model inference.
- Replacing host ATO packages.
- A hosted SaaS as the source of truth. The zip is the source of truth.

## Deliberate non-adoption

Signing and transparency logs are valuable and **not** in v0.3. Adding them too early would ship key material, key ceremony, and identity questions into a public unclassified kit. Hash-link first. Sign later, detached.
