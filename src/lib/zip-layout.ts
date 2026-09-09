/** Zip entries this kit always emits. Missing MUST files fail verify; missing SHOULD files warn. */

export const ZIP_MUST = ["pack.json", "pack.sha256"] as const;

export const ZIP_SHOULD = [
  "README.txt",
  "pack.md",
  "brief.md",
  "gap_report.md",
  "schema/evidence-pack.schema.json",
  "evidence.sha256",
] as const;
