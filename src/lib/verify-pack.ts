import { hashPack, sha256Bytes } from "./canonical";
import { CHECKLIST } from "./checklist";
import { completeness } from "./completeness";
import type { PackArtifact } from "./load-pack";
import { validatePackShape } from "./pack-shape";
import type { EvidencePack } from "./types";
import { ZIP_MUST, ZIP_SHOULD } from "./zip-layout";

export type Finding = { level: "error" | "warning"; code: string; message: string };

export type VerifyResult = {
  ok: boolean;
  findings: Finding[];
};

const FORBIDDEN = [
  { code: "PEM_KEY", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, message: "Private key material in pack text." },
  { code: "GITHUB_TOKEN", re: /\bghp_[A-Za-z0-9]{20,}\b/, message: "GitHub token pattern in pack text." },
  { code: "AWS_KEY", re: /\bAKIA[0-9A-Z]{16}\b/, message: "AWS access key pattern in pack text." },
  { code: "GENERIC_SECRET", re: /\b(api[_-]?key|secret_key|xai-)[^\s]{8,}/i, message: "API key / secret pattern in pack text." },
];

const WEIGHT_EXT = /\.(pt|pth|bin|safetensors|gguf|onnx|ckpt|h5|pkl)$/i;
const BANNED_MARKING = /\b(TOP\s*SECRET|SECRET|CUI|CONFIDENTIAL|FOUO|CLASSIFIED)\b/i;

function walkStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "data_base64") continue;
      walkStrings(v, out);
    }
  }
}

export function verifyPack(pack: EvidencePack): VerifyResult {
  const findings: Finding[] = [];
  const c = completeness(pack);

  if (pack.schema_version === "0.2.0") {
    findings.push({
      level: "warning",
      code: "SCHEMA_02",
      message: "Pack is schema 0.2.0. Emit 0.3.0 with chain before AO review.",
    });
  }

  if (!c.identity_ok) {
    findings.push({
      level: "error",
      code: "IDENTITY",
      message: `Missing identity: ${c.required_identity.filter((f) => !f.ok).map((f) => f.field).join(", ")}.`,
    });
  }

  if (!pack.marking.trim()) {
    findings.push({ level: "error", code: "MARKING", message: "marking is blank. Default is UNCLASSIFIED." });
  } else if (BANNED_MARKING.test(pack.marking) && !/^UNCLASSIFIED$/i.test(pack.marking.trim())) {
    findings.push({
      level: "error",
      code: "MARKING_BANNED",
      message: `marking "${pack.marking}" is not allowed in this public protocol. Use UNCLASSIFIED.`,
    });
  }

  const reqIds = new Set(pack.appendix_b_items.map((i) => i.req_id));
  for (const def of CHECKLIST) {
    if (!reqIds.has(def.req_id)) {
      findings.push({ level: "error", code: "CHECKLIST_GAP", message: `Missing req_id ${def.req_id}.` });
    }
  }

  const hash = pack.model.artifact_hash.trim();
  if (hash && !/^[a-fA-F0-9]{32,}$/.test(hash) && !hash.startsWith("sha256:")) {
    findings.push({
      level: "warning",
      code: "HASH_SHAPE",
      message: "model.artifact_hash does not look like hex or sha256:hex.",
    });
  }

  if (pack.chain.prior_pack_id && !pack.chain.prior_pack_hash) {
    findings.push({
      level: "error",
      code: "CHAIN_UNSEALED",
      message: "chain.prior_pack_id is set but prior_pack_hash is null. Run `ao-pack seal`.",
    });
  }
  if (pack.chain.prior_pack_hash && !/^sha256:[a-f0-9]{64}$/.test(pack.chain.prior_pack_hash)) {
    findings.push({
      level: "error",
      code: "CHAIN_HASH_SHAPE",
      message: "chain.prior_pack_hash must be sha256: + 64 lowercase hex chars.",
    });
  }

  const strings: string[] = [];
  walkStrings(pack, strings);
  for (const text of strings) {
    for (const rule of FORBIDDEN) {
      if (rule.re.test(text)) {
        findings.push({ level: "error", code: rule.code, message: rule.message });
      }
    }
  }

  for (const file of pack.files) {
    if (WEIGHT_EXT.test(file.filename)) {
      findings.push({
        level: "error",
        code: "WEIGHTS",
        message: `Attachment ${file.filename} looks like model weights. Packs must not contain weights.`,
      });
    }
    if (file.size_bytes > 400 * 1024) {
      findings.push({
        level: "warning",
        code: "FILE_SIZE",
        message: `${file.filename} is ${file.size_bytes} bytes. Prefer URI pointers under 400 KB.`,
      });
    }
  }

  if (!c.residual_present) {
    findings.push({
      level: "warning",
      code: "RESIDUAL",
      message: "residual_risk.statement is empty.",
    });
  }

  if (!c.export_ready) {
    findings.push({
      level: "warning",
      code: "EXPORT_NOT_READY",
      message: "Pack is not export-ready (identity, pending items, missing evidence, or residual risk).",
    });
  }

  const ok = !findings.some((f) => f.level === "error");
  return { ok, findings };
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function verifyZip(pack: EvidencePack, files: Map<string, Uint8Array>): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const name of ZIP_MUST) {
    if (!files.has(name)) {
      findings.push({ level: "error", code: "ZIP_LAYOUT", message: `Zip missing required ${name}.` });
    }
  }
  for (const name of ZIP_SHOULD) {
    if (!files.has(name)) {
      findings.push({ level: "warning", code: "ZIP_LAYOUT", message: `Zip missing ${name}.` });
    }
  }

  const claimed = files.get("pack.sha256");
  if (claimed) {
    const got = decode(claimed).trim();
    const want = await hashPack(pack);
    if (got !== want) {
      findings.push({
        level: "error",
        code: "HASH_MISMATCH",
        message: `pack.sha256 is ${got}; canonical hash is ${want}.`,
      });
    }
  }

  for (const file of pack.files) {
    const safe = file.filename.replace(/[/\\]/g, "_").trim();
    if (!safe) continue;
    const key = `evidence/${safe}`;
    const bytes = files.get(key);
    if (!bytes) {
      findings.push({
        level: "warning",
        code: "EVIDENCE_MISSING",
        message: `pack.files lists ${file.filename} but zip has no ${key}.`,
      });
    } else if (file.size_bytes > 0 && bytes.byteLength !== file.size_bytes) {
      findings.push({
        level: "warning",
        code: "EVIDENCE_SIZE",
        message: `${key} is ${bytes.byteLength} bytes; pack says ${file.size_bytes}.`,
      });
    }
  }

  const man = files.get("evidence.sha256");
  if (man) {
    for (const line of decode(man).split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(/^(sha256:[a-f0-9]{64})\s+(\S+)$/);
      if (!m) {
        findings.push({
          level: "error",
          code: "EVIDENCE_MANIFEST",
          message: `Unreadable evidence.sha256 line: ${t}`,
        });
        continue;
      }
      const hash = m[1]!;
      const name = m[2]!;
      const bytes = files.get(name);
      if (!bytes) {
        findings.push({
          level: "error",
          code: "EVIDENCE_MANIFEST",
          message: `evidence.sha256 lists ${name} but zip has no such file.`,
        });
        continue;
      }
      const actual = await sha256Bytes(bytes);
      if (actual !== hash) {
        findings.push({
          level: "error",
          code: "EVIDENCE_HASH",
          message: `${name} does not match evidence.sha256.`,
        });
      }
    }
  } else if ([...files.keys()].some((k) => k.startsWith("evidence/"))) {
    findings.push({
      level: "warning",
      code: "EVIDENCE_MANIFEST",
      message: "Zip has evidence/ but no evidence.sha256.",
    });
  }

  return findings;
}

/** Verify a loaded JSON or zip: schema, pack rules, and zip sidecars. */
export async function verifyArtifact(artifact: PackArtifact): Promise<VerifyResult> {
  const findings: Finding[] = [
    ...validatePackShape(artifact.raw),
    ...verifyPack(artifact.pack).findings,
  ];
  if (artifact.zip) {
    findings.push(...(await verifyZip(artifact.pack, artifact.zip)));
  }
  const ok = !findings.some((f) => f.level === "error");
  return { ok, findings };
}

export function renderVerify(result: VerifyResult): string {
  if (result.findings.length === 0) return "VERIFY OK — no findings.\n";
  const lines = result.findings.map((f) => `${f.level.toUpperCase()} ${f.code}: ${f.message}`);
  return `${result.ok ? "VERIFY OK with warnings" : "VERIFY FAIL"}\n${lines.join("\n")}\n`;
}
