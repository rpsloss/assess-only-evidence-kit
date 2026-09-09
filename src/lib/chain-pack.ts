import { hashPack } from "./canonical";
import { diffPacks, type PackDiff } from "./diff-pack";
import type { EvidencePack } from "./types";

export type ChainStep = {
  index: number;
  pack_id: string;
  version: string;
  hash: string;
  chain_ok: boolean | null;
  model_ok: boolean;
  diff: PackDiff | null;
};

export type ChainResult = {
  ok: boolean;
  steps: ChainStep[];
};

export async function walkChain(packs: EvidencePack[]): Promise<ChainResult> {
  const steps: ChainStep[] = [];
  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i]!;
    const hash = await hashPack(pack);
    if (i === 0) {
      steps.push({
        index: 0,
        pack_id: pack.pack_id,
        version: pack.model.version,
        hash,
        chain_ok: pack.chain.prior_pack_hash ? false : null,
        model_ok: true,
        diff: null,
      });
      if (pack.chain.prior_pack_hash) {
        steps[0]!.chain_ok = false;
      }
      continue;
    }
    const prior = packs[i - 1]!;
    const diff = await diffPacks(prior, pack);
    const model_ok = !prior.model.name || !pack.model.name || prior.model.name === pack.model.name;
    steps.push({
      index: i,
      pack_id: pack.pack_id,
      version: pack.model.version,
      hash,
      chain_ok: diff.chain_ok,
      model_ok,
      diff,
    });
  }
  const ok = steps.every((s, i) => (i === 0 ? s.chain_ok !== false : s.chain_ok === true && s.model_ok));
  return { ok, steps };
}

export function renderChain(result: ChainResult): string {
  const rows = result.steps.map((s) => {
    const link =
      s.index === 0
        ? s.chain_ok === false
          ? "genesis claimed a prior hash"
          : "genesis"
        : s.chain_ok === true
          ? "linked"
          : "BROKEN";
    const model = s.model_ok ? s.version : `${s.version} (model name mismatch)`;
    return `| ${s.index} | \`${s.pack_id}\` | ${model} | ${link} |`;
  });
  return [
    `# Assess-Only chain`,
    ``,
    result.ok ? "**Chain valid.**" : "**Chain INVALID.**",
    ``,
    `| # | Pack | Version | Link |`,
    `| --- | --- | --- | --- |`,
    ...rows,
    ``,
  ].join("\n");
}
