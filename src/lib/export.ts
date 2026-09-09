import { renderBrief } from "./brief-pack";
import { hashPack, sha256Bytes } from "./canonical";
import { completeness } from "./completeness";
import { EXAMPLE_EVAL_SUMMARY, EXAMPLE_HASH_MANIFEST } from "./example-pack";
import { renderGapReport, renderPackMarkdown, renderReadmeTxt } from "./markdown";
import { renderHostPackageMarkdown } from "./host-package";
import { renderPoamCsv, renderPoamMarkdown } from "./poam";
import { renderRequestsMarkdown } from "./requests";
import { renderStatusMarkdown } from "./status-board";
import { EVIDENCE_PACK_SCHEMA_JSON } from "./schema-json";
import type { EvidencePack } from "./types";
import { slugify } from "./utils";
import { buildZip, buildZipBytes, downloadBlob, textBytes, type ZipEntry } from "./zip";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function packJson(pack: EvidencePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export function exportFilename(pack: EvidencePack): string {
  const sys = slugify(pack.system_context.system_name || "host");
  const model = slugify(pack.model.name || "model");
  const ver = slugify(pack.model.version || "ver");
  return `${sys}_${model}_${ver}_assess-only_r${pack.revision}.zip`;
}

export function collectZipEntries(pack: EvidencePack): ZipEntry[] {
  const entries: ZipEntry[] = [
    { name: "README.txt", data: textBytes(renderReadmeTxt(pack)) },
    { name: "pack.md", data: textBytes(renderPackMarkdown(pack)) },
    { name: "brief.md", data: textBytes(renderBrief(pack)) },
    { name: "status.md", data: textBytes(renderStatusMarkdown(pack)) },
    { name: "host_package.md", data: textBytes(renderHostPackageMarkdown(pack)) },
    { name: "requests.md", data: textBytes(renderRequestsMarkdown(pack)) },
    { name: "poam.md", data: textBytes(renderPoamMarkdown(pack)) },
    { name: "poam.csv", data: textBytes(renderPoamCsv(pack)) },
    { name: "gap_report.md", data: textBytes(renderGapReport(pack)) },
    { name: "pack.json", data: textBytes(packJson(pack)) },
    { name: "schema/evidence-pack.schema.json", data: textBytes(EVIDENCE_PACK_SCHEMA_JSON) },
    { name: "schema/v0.3.0/evidence-pack.schema.json", data: textBytes(EVIDENCE_PACK_SCHEMA_JSON) },
  ];

  const seen = new Set<string>();
  for (const file of pack.files) {
    if (!file.filename.trim()) continue;
    const safe = file.filename.replace(/[/\\]/g, "_");
    if (seen.has(safe)) continue;
    seen.add(safe);
    let data: Uint8Array;
    if (file.data_base64) {
      data = b64ToBytes(file.data_base64);
    } else if (safe === "hash-manifest.txt") {
      data = textBytes(EXAMPLE_HASH_MANIFEST);
    } else if (safe === "eval-holdout-v13.txt") {
      data = textBytes(EXAMPLE_EVAL_SUMMARY);
    } else {
      data = textBytes(`Placeholder for ${safe} (no inline bytes stored).\n`);
    }
    entries.push({ name: `evidence/${safe}`, data });
  }
  return entries;
}

export async function renderEvidenceSha256(entries: ZipEntry[]): Promise<string> {
  const lines = ["# sha256 of evidence/* bytes. Not the pack canonical hash.", ""];
  const files = entries
    .filter((e) => e.name.startsWith("evidence/"))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const file of files) {
    lines.push(`${await sha256Bytes(file.data)}  ${file.name}`);
  }
  if (files.length === 0) lines.push("# (no evidence files)");
  return `${lines.join("\n")}\n`;
}

/** Zip entries including pack.sha256 and evidence.sha256. */
export async function collectPackZipEntries(pack: EvidencePack): Promise<ZipEntry[]> {
  const digest = await hashPack(pack);
  const entries = collectZipEntries(pack).filter((e) => e.name !== "brief.md");
  entries.push({ name: "brief.md", data: textBytes(renderBrief(pack, null, digest)) });
  entries.push({ name: "pack.sha256", data: textBytes(`${digest}\n`) });
  entries.push({ name: "evidence.sha256", data: textBytes(await renderEvidenceSha256(entries)) });
  return entries;
}

export async function buildPackZipBytes(pack: EvidencePack): Promise<Uint8Array> {
  return buildZipBytes(await collectPackZipEntries(pack));
}

export async function downloadPackZip(pack: EvidencePack) {
  const blob = buildZip(await collectPackZipEntries(pack));
  downloadBlob(blob, exportFilename(pack));
}

export function downloadSingle(filename: string, text: string, mime: string) {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export { completeness };
