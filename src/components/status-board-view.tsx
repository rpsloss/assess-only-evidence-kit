import { layerLabel } from "@/lib/completeness";
import {
  bucketLabel,
  statusBoard,
  type BoardBucket,
  type BoardItem,
} from "@/lib/status-board";
import type { EvidencePack, Layer } from "@/lib/types";
import { Badge } from "./ui/badge";

const BUCKET_CLASS: Record<BoardBucket, string> = {
  present: "bg-met/15 text-met border-met/30",
  partial: "bg-partial/15 text-partial border-partial/30",
  gapped: "bg-gap/15 text-gap border-gap/30",
  unfinished: "bg-pending/15 text-pending border-pending/30",
};

export function StatusBoardView({
  pack,
  onSelect,
}: {
  pack: EvidencePack;
  onSelect?: (item: BoardItem) => void;
}) {
  const board = statusBoard(pack);
  const buckets: BoardBucket[] = ["present", "partial", "gapped", "unfinished"];
  const attention = [...board.unfinished, ...board.gapped, ...board.partial];

  return (
    <section className="grid gap-4 rounded-lg border border-rule bg-paper-2 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl">Status board</h2>
        <p className="text-sm text-fg-muted">
          {board.export_ready ? "Ready for AO/SCA" : "Not ready for AO/SCA"} · {board.inherited.length} inherited ·{" "}
          {board.this_event.length} this event
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {buckets.map((b) => (
          <button
            key={b}
            type="button"
            className={`rounded-md border px-3 py-2 text-left ${BUCKET_CLASS[b]}`}
            onClick={() => {
              const first = board.items.find((i) => i.bucket === b);
              if (first) onSelect?.(first);
            }}
          >
            <div className="text-xs uppercase tracking-wide">{bucketLabel(b)}</div>
            <div className="font-serif text-3xl">{board.counts[b]}</div>
          </button>
        ))}
      </div>
      <ul className="grid gap-1 text-sm">
        {board.gates.map((g) => (
          <li key={g.id} className={g.ok ? "text-fg-muted" : g.blocking ? "text-gap" : "text-partial"}>
            {g.ok ? "✓" : "○"} {g.blocking ? "" : "(info) "}
            {g.label}
          </li>
        ))}
      </ul>
      {(["infra", "model"] as Layer[]).map((layer) => (
        <div key={layer} className="grid gap-2">
          <h3 className="text-sm font-medium">
            {layerLabel(layer)} · {board.by_layer[layer].present} present / {board.by_layer[layer].partial}{" "}
            partial / {board.by_layer[layer].gapped} gapped / {board.by_layer[layer].unfinished} unfinished
          </h3>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
            {board.items
              .filter((i) => i.layer === layer)
              .map((item) => (
                <button
                  key={item.req_id}
                  type="button"
                  title={`${item.req_id} ${item.title} — ${item.origin === "inherited" ? "inherited" : "this event"} — ${item.reason}`}
                  className={`rounded border px-2 py-1 text-left text-xs ${BUCKET_CLASS[item.bucket]}`}
                  onClick={() => onSelect?.(item)}
                >
                  <div className="font-medium">{item.req_id}</div>
                  <div className="truncate opacity-80">
                    {bucketLabel(item.bucket)}
                    {item.origin === "inherited" ? " · inh" : ""}
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
      {attention.length > 0 && (
        <div className="grid gap-1 text-sm">
          <h3 className="font-medium">Needs attention</h3>
          {attention.slice(0, 8).map((item) => (
            <button
              key={item.req_id}
              type="button"
              className="text-left hover:underline"
              onClick={() => onSelect?.(item)}
            >
              <Badge className={BUCKET_CLASS[item.bucket]}>{bucketLabel(item.bucket)}</Badge>{" "}
              <span className="font-medium">{item.req_id}</span> — {item.reason}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function PackBoardStrip({ pack }: { pack: EvidencePack }) {
  const board = statusBoard(pack);
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="text-met">present {board.counts.present}</span>
      <span className="text-partial">partial {board.counts.partial}</span>
      <span className="text-gap">gapped {board.counts.gapped}</span>
      <span className="text-pending">unfinished {board.counts.unfinished}</span>
    </div>
  );
}
