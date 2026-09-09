import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { renderBrief } from "@/lib/brief-pack";
import { hashPack } from "@/lib/canonical";
import { CHECKLIST, itemsForLayer } from "@/lib/checklist";
import { completeness, layerLabel, statusLabel } from "@/lib/completeness";
import { downloadPackZip, downloadSingle, packJson } from "@/lib/export";
import { renderGapReport, renderPackMarkdown } from "@/lib/markdown";
import { renderStatusMarkdown, statusBoard } from "@/lib/status-board";
import { verifyPack } from "@/lib/verify-pack";
import { usePackStore } from "@/lib/store";
import {
  AUTHOR_ROLES,
  EVENT_TYPES,
  ITEM_STATUSES,
  type AuthorRole,
  type EvidencePack,
  type EventType,
  type ItemStatus,
  type Layer,
} from "@/lib/types";
import { formatWhen, uid } from "@/lib/utils";
import { StatusBoardView } from "./status-board-view";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const MAX_FILE_BYTES = 400 * 1024;
type Tab = "identity" | "checklist" | "evaluations" | "thresholds" | "residual" | "files";

export function PackEditor({ pack }: { pack: EvidencePack }) {
  const navigate = useNavigate();
  const update = usePackStore((s) => s.update);
  const remove = usePackStore((s) => s.remove);
  const bumpFrom = usePackStore((s) => s.bumpFrom);
  const [tab, setTab] = useState<Tab>("identity");
  const [layer, setLayer] = useState<Layer | "all">("all");
  const [focusReqId, setFocusReqId] = useState<string | null>(null);
  const [packHash, setPackHash] = useState("");
  const c = completeness(pack);
  const board = statusBoard(pack);
  const verify = verifyPack(pack);
  const chainLabel = pack.chain.prior_pack_id
    ? pack.chain.prior_pack_hash
      ? "sealed"
      : "unsealed"
    : "genesis";

  useEffect(() => {
    let live = true;
    void hashPack(pack).then((h) => {
      if (live) setPackHash(h);
    });
    return () => {
      live = false;
    };
  }, [pack]);

  function patch(mut: (next: EvidencePack) => void) {
    update(pack.pack_id, (current) => {
      const next = structuredClone(current);
      mut(next);
      return next;
    });
  }

  function exportZip() {
    const nextRev = pack.revision + 1;
    const stamped = { ...pack, revision: nextRev };
    patch((p) => {
      p.revision = nextRev;
    });
    downloadPackZip(stamped);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-widest text-fg-muted">
            <Link to="/" className="hover:underline">
              Packs
            </Link>
            <span> / {pack.pack_id}</span>
          </p>
          <h1 className="font-serif text-3xl">
            {pack.model.name || "Untitled model"}{" "}
            <span className="text-fg-muted text-xl">
              {pack.model.prior_version || "?"} → {pack.model.version || "?"}
            </span>
          </h1>
          <p className="text-sm text-fg-muted">
            {pack.system_context.system_name || "No host name"} · r{pack.revision} · updated{" "}
            {formatWhen(pack.updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const next = bumpFrom(pack.pack_id);
              if ("error" in next) return;
              void navigate({ to: "/pack/$packId", params: { packId: next.pack_id } });
            }}
          >
            Bump from this pack
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadSingle("brief.md", renderBrief(pack, null, packHash || null), "text/markdown")}
          >
            brief.md
          </Button>
          <Button variant="outline" onClick={() => downloadSingle("pack.md", renderPackMarkdown(pack), "text/markdown")}>
            pack.md
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadSingle("status.md", renderStatusMarkdown(pack), "text/markdown")}
          >
            status.md
          </Button>
          <Button variant="outline" onClick={() => downloadSingle("gap_report.md", renderGapReport(pack), "text/markdown")}>
            gap_report.md
          </Button>
          <Button onClick={exportZip}>Download pack for AO/SCA</Button>
        </div>
      </header>

      <section className="grid gap-3 rounded-lg border border-rule bg-paper-2 p-4 md:grid-cols-4">
        <Stat label="Completeness" value={`${c.score}%`} />
        <Stat label="Present / partial" value={`${board.counts.present} / ${board.counts.partial}`} />
        <Stat label="Gapped / unfinished" value={`${board.counts.gapped} / ${board.counts.unfinished}`} />
        <Stat label="Ready for AO/SCA" value={board.export_ready ? "yes" : "not yet"} />
        <Stat label="Verify" value={verify.ok ? "OK" : "FAIL"} />
        <Stat label="Chain" value={chainLabel} />
        <Stat label="Canonical hash" value={packHash ? packHash.slice(0, 19) + "…" : "hashing"} />
        <Stat label="Prior" value={pack.chain.prior_pack_id ?? "genesis"} />
        {!c.identity_ok && (
          <p className="md:col-span-4 text-sm text-gap">
            Fill required identity fields before treating this pack as ready for AO/SCA.
          </p>
        )}
        {verify.findings.length > 0 && (
          <ul className="md:col-span-4 text-sm grid gap-1">
            {verify.findings.slice(0, 8).map((f) => (
              <li key={`${f.code}:${f.message}`} className={f.level === "error" ? "text-gap" : "text-fg-muted"}>
                {f.level.toUpperCase()} {f.code}: {f.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <StatusBoardView
        pack={pack}
        onSelect={(item) => {
          setLayer(item.layer);
          setFocusReqId(item.req_id);
          setTab("checklist");
        }}
      />

      <nav className="flex flex-wrap gap-1 border-b border-rule pb-1">
        {(
          [
            ["identity", "Identity"],
            ["checklist", "Checklist"],
            ["evaluations", "Evaluations"],
            ["thresholds", "Thresholds"],
            ["residual", "Residual & ConMon"],
            ["files", "Files"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${tab === id ? "bg-accent text-white" : "hover:bg-paper-2"}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "identity" && <IdentityTab pack={pack} patch={patch} />}
      {tab === "checklist" && (
        <ChecklistTab
          pack={pack}
          patch={patch}
          layer={layer}
          setLayer={setLayer}
          focusReqId={focusReqId}
        />
      )}
      {tab === "evaluations" && <EvaluationsTab pack={pack} patch={patch} />}
      {tab === "thresholds" && <ThresholdsTab pack={pack} patch={patch} />}
      {tab === "residual" && <ResidualTab pack={pack} patch={patch} />}
      {tab === "files" && <FilesTab pack={pack} patch={patch} />}

      <div className="flex justify-end pt-4 border-t border-rule">
        <Button
          variant="destructive"
          onClick={() => {
            if (!window.confirm("Delete this pack from local storage?")) return;
            remove(pack.pack_id);
            void navigate({ to: "/" });
          }}
        >
          Delete pack
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function IdentityTab({
  pack,
  patch,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Author name">
        <Input value={pack.author_name} onChange={(e) => patch((p) => { p.author_name = e.target.value; })} />
      </Field>
      <Field label="Author role">
        <select
          className="h-9 rounded-md border border-rule bg-white px-2 text-sm"
          value={pack.author_role}
          onChange={(e) => patch((p) => { p.author_role = e.target.value as AuthorRole; })}
        >
          {AUTHOR_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Marking">
        <Input value={pack.marking} onChange={(e) => patch((p) => { p.marking = e.target.value; })} />
      </Field>
      <Field label="Event type">
        <select
          className="h-9 rounded-md border border-rule bg-white px-2 text-sm"
          value={pack.event.type}
          onChange={(e) => patch((p) => { p.event.type = e.target.value as EventType; })}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Host system name">
        <Input
          value={pack.system_context.system_name}
          onChange={(e) => patch((p) => { p.system_context.system_name = e.target.value; })}
        />
      </Field>
      <Field label="ATO id or reference">
        <Input
          value={pack.system_context.ato_id_or_ref}
          onChange={(e) => patch((p) => { p.system_context.ato_id_or_ref = e.target.value; })}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Boundary notes">
          <Textarea
            value={pack.system_context.boundary_notes}
            onChange={(e) => patch((p) => { p.system_context.boundary_notes = e.target.value; })}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Environment notes">
          <Textarea
            value={pack.system_context.environment_notes}
            onChange={(e) => patch((p) => { p.system_context.environment_notes = e.target.value; })}
          />
        </Field>
      </div>
      <Field label="Model name">
        <Input value={pack.model.name} onChange={(e) => patch((p) => { p.model.name = e.target.value; })} />
      </Field>
      <Field label="Task">
        <Input value={pack.model.task} onChange={(e) => patch((p) => { p.model.task = e.target.value; })} />
      </Field>
      <Field label="Prior version">
        <Input
          value={pack.model.prior_version}
          onChange={(e) => patch((p) => { p.model.prior_version = e.target.value; })}
        />
      </Field>
      <Field label="New version">
        <Input value={pack.model.version} onChange={(e) => patch((p) => { p.model.version = e.target.value; })} />
      </Field>
      <Field label="Artifact hash">
        <Input
          value={pack.model.artifact_hash}
          onChange={(e) => patch((p) => { p.model.artifact_hash = e.target.value; })}
        />
      </Field>
      <Field label="Hash algorithm">
        <Input value={pack.model.hash_alg} onChange={(e) => patch((p) => { p.model.hash_alg = e.target.value; })} />
      </Field>
      <Field label="Catalog URI">
        <Input
          value={pack.model.catalog_uri}
          onChange={(e) => patch((p) => { p.model.catalog_uri = e.target.value; })}
        />
      </Field>
      <Field label="Training-data provenance URI">
        <Input
          value={pack.model.training_data_provenance_ref}
          onChange={(e) => patch((p) => { p.model.training_data_provenance_ref = e.target.value; })}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Event rationale">
          <Textarea
            value={pack.event.rationale}
            onChange={(e) => patch((p) => { p.event.rationale = e.target.value; })}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Change summary">
          <Textarea
            value={pack.event.change_summary}
            onChange={(e) => patch((p) => { p.event.change_summary = e.target.value; })}
          />
        </Field>
      </div>
    </div>
  );
}

function ChecklistTab({
  pack,
  patch,
  layer,
  setLayer,
  focusReqId,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
  layer: Layer | "all";
  setLayer: (layer: Layer | "all") => void;
  focusReqId: string | null;
}) {
  const defs = layer === "all" ? CHECKLIST : itemsForLayer(layer);
  useEffect(() => {
    if (!focusReqId) return;
    document.getElementById(`item-${focusReqId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusReqId, layer]);
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        {(["all", "infra", "model"] as const).map((id) => (
          <Button key={id} size="sm" variant={layer === id ? "default" : "secondary"} onClick={() => setLayer(id)}>
            {id === "all" ? "All 22" : layerLabel(id)}
          </Button>
        ))}
      </div>
      {defs.map((def) => {
        const state = pack.appendix_b_items.find((i) => i.req_id === def.req_id);
        if (!state) return null;
        return (
          <article
              key={def.req_id}
              id={`item-${def.req_id}`}
              className={`rounded-lg border bg-white p-4 grid gap-3 ${
                focusReqId === def.req_id ? "border-accent ring-2 ring-accent/30" : "border-rule"
              }`}
            >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-fg-muted">
                  {def.req_id} · {layerLabel(def.layer)} · {def.controls.join(", ")}
                </div>
                <h2 className="font-serif text-xl">{def.title}</h2>
              </div>
              <StatusBadge status={state.status} />
            </div>
            <p className="text-sm">{def.prompt}</p>
            <p className="text-xs text-fg-muted">
              Evidence hint: {def.evidence_hint} · {def.appendix_ref}
            </p>
            <div className="grid gap-3 md:grid-cols-[10rem_1fr]">
              <Field label="Status">
                <select
                  className="h-9 rounded-md border border-rule bg-white px-2 text-sm"
                  value={state.status}
                  onChange={(e) =>
                    patch((p) => {
                      const item = p.appendix_b_items.find((i) => i.req_id === def.req_id);
                      if (item) item.status = e.target.value as ItemStatus;
                    })
                  }
                >
                  {ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <Textarea
                  value={state.notes}
                  onChange={(e) =>
                    patch((p) => {
                      const item = p.appendix_b_items.find((i) => i.req_id === def.req_id);
                      if (item) item.notes = e.target.value;
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Evidence URI or filename">
              <Input
                value={state.evidence_refs[0]?.value ?? ""}
                placeholder="uri://… or attachment filename"
                onChange={(e) =>
                  patch((p) => {
                    const item = p.appendix_b_items.find((i) => i.req_id === def.req_id);
                    if (!item) return;
                    const value = e.target.value;
                    if (!value) {
                      item.evidence_refs = [];
                      return;
                    }
                    item.evidence_refs = [
                      {
                        id: item.evidence_refs[0]?.id || uid("ref"),
                        kind: value.includes("://") ? "uri" : "file",
                        value,
                        note: item.evidence_refs[0]?.note ?? "",
                      },
                    ];
                  })
                }
              />
            </Field>
          </article>
        );
      })}
    </div>
  );
}

function EvaluationsTab({
  pack,
  patch,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
}) {
  return (
    <div className="grid gap-4">
      {pack.evaluations.map((ev, idx) => (
        <article key={ev.id} className="rounded-lg border border-rule bg-white p-4 grid gap-3 md:grid-cols-2">
          <Field label="Name">
            <Input
              value={ev.name}
              onChange={(e) =>
                patch((p) => {
                  p.evaluations[idx]!.name = e.target.value;
                })
              }
            />
          </Field>
          <Field label="Dataset ref">
            <Input
              value={ev.dataset_ref}
              onChange={(e) =>
                patch((p) => {
                  p.evaluations[idx]!.dataset_ref = e.target.value;
                })
              }
            />
          </Field>
          <Field label="Metrics (key=value, comma-separated)">
            <Input
              value={Object.entries(ev.metrics)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")}
              onChange={(e) =>
                patch((p) => {
                  const metrics: Record<string, string> = {};
                  for (const part of e.target.value.split(",")) {
                    const [k, ...rest] = part.split("=");
                    if (!k?.trim()) continue;
                    metrics[k.trim()] = rest.join("=").trim();
                  }
                  p.evaluations[idx]!.metrics = metrics;
                })
              }
            />
          </Field>
          <Field label="Result">
            <select
              className="h-9 rounded-md border border-rule bg-white px-2 text-sm"
              value={ev.passed === null ? "na" : ev.passed ? "pass" : "fail"}
              onChange={(e) =>
                patch((p) => {
                  p.evaluations[idx]!.passed =
                    e.target.value === "na" ? null : e.target.value === "pass";
                })
              }
            >
              <option value="na">n/a</option>
              <option value="pass">pass</option>
              <option value="fail">fail</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Raw artifact URI">
              <Input
                value={ev.raw_artifact_uri}
                onChange={(e) =>
                  patch((p) => {
                    p.evaluations[idx]!.raw_artifact_uri = e.target.value;
                  })
                }
              />
            </Field>
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                patch((p) => {
                  p.evaluations.splice(idx, 1);
                })
              }
            >
              Remove
            </Button>
          </div>
        </article>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          patch((p) => {
            p.evaluations.push({
              id: uid("eval"),
              name: "",
              dataset_ref: "",
              metrics: {},
              passed: null,
              raw_artifact_uri: "",
            });
          })
        }
      >
        Add evaluation
      </Button>
    </div>
  );
}

function ThresholdsTab({
  pack,
  patch,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
}) {
  return (
    <div className="grid gap-6">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pack.thresholds.negotiated}
          onChange={(e) => patch((p) => { p.thresholds.negotiated = e.target.checked; })}
        />
        AO has accepted these thresholds
      </label>
      <div>
        <h2 className="font-serif text-xl mb-2">Performance</h2>
        {pack.thresholds.performance.map((row, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
            <Input
              placeholder="metric"
              value={row.metric}
              onChange={(e) => patch((p) => { p.thresholds.performance[idx]!.metric = e.target.value; })}
            />
            <Input
              placeholder=">="
              value={row.operator}
              onChange={(e) =>
                patch((p) => {
                  p.thresholds.performance[idx]!.operator = e.target.value as ">=" | "<=" | ">";
                })
              }
            />
            <Input
              placeholder="value"
              value={row.value}
              onChange={(e) => patch((p) => { p.thresholds.performance[idx]!.value = e.target.value; })}
            />
            <Input
              placeholder="unit"
              value={row.unit}
              onChange={(e) => patch((p) => { p.thresholds.performance[idx]!.unit = e.target.value; })}
            />
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            patch((p) => {
              p.thresholds.performance.push({ metric: "", operator: ">=", value: "", unit: "" });
            })
          }
        >
          Add performance threshold
        </Button>
      </div>
      <div>
        <h2 className="font-serif text-xl mb-2">Drift</h2>
        {pack.thresholds.drift.map((row, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
            <Input
              placeholder="metric"
              value={row.metric}
              onChange={(e) => patch((p) => { p.thresholds.drift[idx]!.metric = e.target.value; })}
            />
            <Input
              placeholder="<="
              value={row.operator}
              onChange={(e) =>
                patch((p) => {
                  p.thresholds.drift[idx]!.operator = e.target.value as "<=" | "<";
                })
              }
            />
            <Input
              placeholder="value"
              value={row.value}
              onChange={(e) => patch((p) => { p.thresholds.drift[idx]!.value = e.target.value; })}
            />
            <Input
              placeholder="method"
              value={row.method}
              onChange={(e) => patch((p) => { p.thresholds.drift[idx]!.method = e.target.value; })}
            />
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            patch((p) => {
              p.thresholds.drift.push({
                metric: "",
                operator: "<=",
                value: "",
                method: "population_stability_index",
              });
            })
          }
        >
          Add drift threshold
        </Button>
      </div>
      <Field label="Re-authorization / re-assess trigger">
        <Textarea
          value={pack.thresholds.reauth_trigger_notes}
          onChange={(e) => patch((p) => { p.thresholds.reauth_trigger_notes = e.target.value; })}
        />
      </Field>
    </div>
  );
}

function ResidualTab({
  pack,
  patch,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
}) {
  return (
    <div className="grid gap-4">
      <Field label="Residual risk statement">
        <Textarea
          className="min-h-32"
          value={pack.residual_risk.statement}
          onChange={(e) => patch((p) => { p.residual_risk.statement = e.target.value; })}
        />
      </Field>
      <Field label="Mitigations (one per line)">
        <Textarea
          value={pack.residual_risk.mitigations.join("\n")}
          onChange={(e) =>
            patch((p) => {
              p.residual_risk.mitigations = e.target.value.split("\n");
            })
          }
        />
      </Field>
      <Field label="AO decision">
        <select
          className="h-9 rounded-md border border-rule bg-white px-2 text-sm"
          value={pack.residual_risk.ao_decision}
          onChange={(e) =>
            patch((p) => {
              p.residual_risk.ao_decision = e.target.value as EvidencePack["residual_risk"]["ao_decision"];
            })
          }
        >
          <option value="pending">pending</option>
          <option value="accepted">accepted</option>
          <option value="rejected">rejected</option>
        </select>
      </Field>
      <Field label="AO decision notes">
        <Textarea
          value={pack.residual_risk.ao_decision_notes}
          onChange={(e) => patch((p) => { p.residual_risk.ao_decision_notes = e.target.value; })}
        />
      </Field>
      <Field label="What is monitored">
        <Textarea
          value={pack.conmon_hooks.what_is_monitored}
          onChange={(e) => patch((p) => { p.conmon_hooks.what_is_monitored = e.target.value; })}
        />
      </Field>
      <Field label="Alert owner">
        <Input
          value={pack.conmon_hooks.alert_owner}
          onChange={(e) => patch((p) => { p.conmon_hooks.alert_owner = e.target.value; })}
        />
      </Field>
      <Field label="Log source refs (one per line)">
        <Textarea
          value={pack.conmon_hooks.log_source_refs.join("\n")}
          onChange={(e) =>
            patch((p) => {
              p.conmon_hooks.log_source_refs = e.target.value.split("\n");
            })
          }
        />
      </Field>
      <Field label="Cadence notes">
        <Textarea
          value={pack.conmon_hooks.cadence_notes}
          onChange={(e) => patch((p) => { p.conmon_hooks.cadence_notes = e.target.value; })}
        />
      </Field>
    </div>
  );
}

function FilesTab({
  pack,
  patch,
}: {
  pack: EvidencePack;
  patch: (mut: (next: EvidencePack) => void) => void;
}) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-fg-muted">
        Prefer URI pointers. Optional attachments are capped at 400 KB each. Never attach weights, API keys, or CUI.
      </p>
      <input
        type="file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > MAX_FILE_BYTES) {
            window.alert("Attachment exceeds 400 KB.");
            return;
          }
          const buf = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (const b of buf) binary += String.fromCharCode(b);
          patch((p) => {
            p.files.push({
              id: uid("file"),
              filename: file.name,
              mime: file.type || "application/octet-stream",
              size_bytes: file.size,
              data_base64: btoa(binary),
            });
          });
        }}
      />
      <ul className="grid gap-2">
        {pack.files.map((file) => (
          <li key={file.id} className="flex items-center justify-between rounded border border-rule bg-white px-3 py-2 text-sm">
            <span>
              {file.filename}{" "}
              <span className="text-fg-muted">
                ({file.size_bytes} bytes{file.data_base64 ? "" : ", placeholder"})
              </span>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                patch((p) => {
                  p.files = p.files.filter((f) => f.id !== file.id);
                })
              }
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <pre className="overflow-auto rounded bg-ink text-paper text-xs p-3 max-h-64">{packJson(pack)}</pre>
    </div>
  );
}

