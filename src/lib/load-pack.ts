import { readFileSync } from "node:fs";
import { parsePackJson, type ParseResult } from "./parse-pack";
import type { EvidencePack } from "./types";
import { unzipStore } from "./unzip";

export type PackArtifact = {
  path: string;
  pack: EvidencePack;
  raw: unknown;
  zip?: Map<string, Uint8Array>;
};

export function loadPackArtifact(path: string): PackArtifact {
  const buf = new Uint8Array(readFileSync(path));
  let text: string;
  let zip: Map<string, Uint8Array> | undefined;
  if (path.endsWith(".zip")) {
    zip = unzipStore(buf);
    const rawJson = zip.get("pack.json");
    if (!rawJson) throw new Error(`${path}: ZIP is missing pack.json.`);
    text = new TextDecoder().decode(rawJson);
  } else {
    text = new TextDecoder().decode(buf);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${path}: Not valid JSON.`);
  }
  const parsed: ParseResult = parsePackJson(raw);
  if (!parsed.ok) throw new Error(`${path}: ${parsed.error}`);
  return { path, pack: parsed.pack, raw, zip };
}

export function loadPackFromPath(path: string): EvidencePack {
  return loadPackArtifact(path).pack;
}
