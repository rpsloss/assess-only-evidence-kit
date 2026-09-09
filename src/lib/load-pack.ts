import { readFileSync } from "node:fs";
import { parsePackJson, type ParseResult } from "./parse-pack";
import { readPackJsonFromZip } from "./unzip";
import type { EvidencePack } from "./types";

export function loadPackFromPath(path: string): EvidencePack {
  const buf = new Uint8Array(readFileSync(path));
  const text = path.endsWith(".zip")
    ? readPackJsonFromZip(buf)
    : new TextDecoder().decode(buf);
  const parsed: ParseResult = parsePackJson(text);
  if (!parsed.ok) throw new Error(`${path}: ${parsed.error}`);
  return parsed.pack;
}
