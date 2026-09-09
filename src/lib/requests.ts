import { CHECKLIST } from "./checklist";
import { completeness, hasEvidence, itemById } from "./completeness";
import type { AuthorRole, EvidencePack } from "./types";

/** Who the assembler should ask. ISSM may be the assembler themselves. */
export type AskRole = Extract<AuthorRole, "ISSM" | "model_owner" | "mlops">;

export type Ask = {
  id: string;
  role: AskRole;
  blocking: boolean;
  title: string;
  need: string;
  pointer: string;
};

function add(out: Ask[], ask: Ask) {
  if (out.some((a) => a.id === ask.id)) return;
  out.push(ask);
}

/** Open asks so the assembler can finish one event. Derived; not stored. */
export function collectRequests(pack: EvidencePack): Ask[] {
  const c = completeness(pack);
  const asks: Ask[] = [];

  const identityAsks: { field: string; role: AskRole; title: string; need: string; pointer: string }[] = [
    {
      field: "system_name",
      role: "ISSM",
      title: "Host system name",
      need: "Unclassified host / enclave name as it appears on the ATO package.",
      pointer: "system_context.system_name",
    },
    {
      field: "ato_id_or_ref",
      role: "ISSM",
      title: "Host ATO reference",
      need: "ATO id or package reference (no CUI).",
      pointer: "system_context.ato_id_or_ref",
    },
    {
      field: "model.name",
      role: "mlops",
      title: "Model name",
      need: "Catalog name for this artifact.",
      pointer: "model.name",
    },
    {
      field: "model.prior_version",
      role: "mlops",
      title: "Prior model version",
      need: "Version this bump replaces.",
      pointer: "model.prior_version",
    },
    {
      field: "model.version",
      role: "mlops",
      title: "New model version",
      need: "Version id for this event.",
      pointer: "model.version",
    },
    {
      field: "model.artifact_hash",
      role: "mlops",
      title: "Model artifact hash",
      need: "sha256 (or catalog digest) of weights. Do not send weights.",
      pointer: "model.artifact_hash",
    },
    {
      field: "event.rationale",
      role: "ISSM",
      title: "Event rationale",
      need: "Why this bump/retrain/threshold event is happening.",
      pointer: "event.rationale",
    },
  ];
  for (const row of identityAsks) {
    const field = c.required_identity.find((f) => f.field === row.field);
    if (field && !field.ok) {
      add(asks, { id: `id:${row.field}`, blocking: true, ...row });
    }
  }

  if (!pack.model.catalog_uri.trim()) {
    add(asks, {
      id: "id:catalog_uri",
      role: "mlops",
      blocking: false,
      title: "Catalog URI",
      need: "Pointer to the immutable catalog tag for this version.",
      pointer: "model.catalog_uri",
    });
  }
  if (!pack.model.training_data_provenance_ref.trim()) {
    add(asks, {
      id: "id:provenance",
      role: "model_owner",
      blocking: false,
      title: "Training-data provenance",
      need: "URI to the data card or provenance record (unclassified).",
      pointer: "model.training_data_provenance_ref",
    });
  }
  if (!c.evals_present) {
    add(asks, {
      id: "eval:holdout",
      role: "model_owner",
      blocking: false,
      title: "Holdout / T&E summary",
      need: "Unclassified metrics (F1, precision, pass/fail) and dataset URI. No raw PII.",
      pointer: "evaluations[]",
    });
  }
  if (!c.thresholds_filled) {
    add(asks, {
      id: "thr:values",
      role: "ISSM",
      blocking: false,
      title: "Performance or drift threshold",
      need: "Proposed F1/PSI (or equivalent) the AO can accept or reject.",
      pointer: "thresholds",
    });
  }
  if (!c.residual_present) {
    add(asks, {
      id: "risk:residual",
      role: "ISSM",
      blocking: true,
      title: "Residual-risk statement",
      need: "What residual the AO is asked to accept, in unclassified language.",
      pointer: "residual_risk.statement",
    });
  }
  if (!c.conmon_present) {
    add(asks, {
      id: "conmon:hooks",
      role: "ISSM",
      blocking: false,
      title: "ConMon hook",
      need: "What is monitored after incorporation (job name, cadence). No CUI logs.",
      pointer: "conmon_hooks.what_is_monitored",
    });
  }
  if (pack.chain.prior_pack_id && !pack.chain.prior_pack_hash) {
    add(asks, {
      id: "chain:seal",
      role: "ISSM",
      blocking: true,
      title: "Seal chain hash",
      need: "Run `ao-pack seal` against the prior pack so prior_pack_hash is set.",
      pointer: "chain.prior_pack_hash",
    });
  }

  for (const def of CHECKLIST) {
    const state = itemById(pack, def.req_id);
    const status = state?.status ?? "pending";
    if (status === "pending") {
      add(asks, {
        id: `item:${def.req_id}:pending`,
        role: def.layer === "model" ? "model_owner" : "ISSM",
        blocking: true,
        title: `Assess ${def.req_id}`,
        need: `${def.title}. Status is still unfinished.`,
        pointer: `appendix_b_items ${def.req_id}`,
      });
    }
    if ((status === "met" || status === "partial") && state && !hasEvidence(state)) {
      add(asks, {
        id: `item:${def.req_id}:evidence`,
        role: def.layer === "model" ? "model_owner" : "mlops",
        blocking: true,
        title: `Evidence for ${def.req_id}`,
        need: "URI pointer or unclassified notes. Do not attach weights or CUI.",
        pointer: `appendix_b_items ${def.req_id}`,
      });
    }
  }

  const sbom = itemById(pack, "INF-SBOM-01");
  if (sbom && (sbom.status === "partial" || sbom.status === "gap")) {
    add(asks, {
      id: "item:INF-SBOM-01:sbom",
      role: "mlops",
      blocking: false,
      title: "Model-artifact SBOM",
      need: "URI to CycloneDX / SBOM-for-AI for the model artifact (serving-stack SBOM is not enough).",
      pointer: "INF-SBOM-01",
    });
  }

  return asks;
}

export function renderRequestsMarkdown(pack: EvidencePack): string {
  const asks = collectRequests(pack);
  const blocking = asks.filter((a) => a.blocking);
  const roles: AskRole[] = ["ISSM", "mlops", "model_owner"];
  const sections = roles.flatMap((role) => {
    const rows = asks.filter((a) => a.role === role);
    if (rows.length === 0) return [];
    return [
      `## ${role}`,
      ``,
      `| Block? | Need | Send | Pack field |`,
      `| --- | --- | --- | --- |`,
      ...rows.map(
        (a) =>
          `| ${a.blocking ? "yes" : "info"} | ${a.title} | ${a.need.replace(/\|/g, "/")} | \`${a.pointer}\` |`,
      ),
      ``,
    ];
  });

  return [
    `# Evidence requests`,
    ``,
    `**UNCLASSIFIED.** The assembler uses this list to finish one model event. Recipients send **URI pointers and unclassified summaries**. Do not send weights, keys, or CUI.`,
    ``,
    `| | |`,
    `| --- | --- |`,
    `| Pack | \`${pack.pack_id}\` r${pack.revision} |`,
    `| Model | ${pack.model.name || "—"} ${pack.model.prior_version || "?"} → ${pack.model.version || "?"} |`,
    `| Open asks | ${asks.length} |`,
    `| Blocking (ready for AO/SCA) | ${blocking.length} |`,
    ``,
    asks.length === 0
      ? "_No open asks. Identity, evals, and overlay items have enough for the assembler to export._"
      : sections.join("\n"),
    ``,
    `Paste replies into the workbench or ` + "`pack.json`" + `. Then re-export the zip for AO/SCA.`,
    ``,
  ].join("\n");
}
