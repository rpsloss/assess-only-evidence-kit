import type { EvidencePack } from "./types";

export const HASH_ALG = "sha256" as const;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(rec)
        .sort()
        .map((k) => [k, sortValue(rec[k])]),
    );
  }
  return value;
}

/** Pack identity for hashing: drop inline file bytes. */
export function packForHash(pack: EvidencePack): unknown {
  const copy = JSON.parse(JSON.stringify(pack)) as EvidencePack;
  copy.files = (copy.files ?? []).map((f) => ({
    id: f.id,
    filename: f.filename,
    mime: f.mime,
    size_bytes: f.size_bytes,
    data_base64: "",
  }));
  return sortValue(copy);
}

export function canonicalJson(pack: EvidencePack): string {
  return JSON.stringify(packForHash(pack));
}

export async function hashPack(pack: EvidencePack): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(pack));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${HASH_ALG}:${hex}`;
}

export function parseHash(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!/^sha256:[a-f0-9]{64}$/.test(v)) return null;
  return v;
}
