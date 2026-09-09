import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { PackBoardStrip } from "@/components/status-board-view";
import { completeness } from "@/lib/completeness";
import { usePackStore } from "@/lib/store";
import { formatWhen } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = usePackStore((s) => s.hydrated);
  const packs = usePackStore((s) => s.packs);
  const order = usePackStore((s) => s.order);
  const createNew = usePackStore((s) => s.createNew);
  const loadExample = usePackStore((s) => s.loadExample);
  const importJson = usePackStore((s) => s.importJson);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-sm text-fg-muted">Loading packs…</main>
    );
  }

  const list = order.map((id) => packs[id]).filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 grid gap-8">
      <section className="grid gap-3 max-w-3xl">
        <h1 className="font-serif text-4xl">Assemble one model event</h1>
        <p className="text-fg-muted">
          You fill the pack. The zip is the product for the AO/SCA. Walk identity and the 22-item
          board (present / partial / gapped / unfinished), then download. Prefer URI pointers. Never put
          API keys, weights, or CUI in a pack.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const pack = createNew();
              void navigate({ to: "/pack/$packId", params: { packId: pack.pack_id } });
            }}
          >
            New pack
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const pack = loadExample();
              void navigate({ to: "/pack/$packId", params: { packId: pack.pack_id } });
            }}
          >
            Open sample
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Import pack.json
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const text = await file.text();
              let raw: unknown;
              try {
                raw = JSON.parse(text);
              } catch {
                window.alert("File is not valid JSON.");
                return;
              }
              const result = importJson(raw, true);
              if ("error" in result) {
                window.alert(result.error);
                return;
              }
              void navigate({ to: "/pack/$packId", params: { packId: result.pack.pack_id } });
            }}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Local packs</h2>
        {list.length === 0 ? (
          <p className="text-sm text-fg-muted">
            None yet. Create a pack or open the sanitized <strong>doc-route-clf 1.2.0 → 1.3.0</strong> sample.
          </p>
        ) : (
          <ul className="grid gap-2">
            {list.map((pack) => {
              if (!pack) return null;
              const c = completeness(pack);
              return (
                <li key={pack.pack_id}>
                  <Link
                    to="/pack/$packId"
                    params={{ packId: pack.pack_id }}
                    className="block rounded-lg border border-rule bg-white px-4 py-3 hover:border-accent"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-serif text-xl">
                        {pack.model.name || "Untitled model"} {pack.model.prior_version || "?"} →{" "}
                        {pack.model.version || "?"}
                      </span>
                      <span className="text-sm text-fg-muted">{c.score}% complete</span>
                    </div>
                    <div className="text-sm text-fg-muted">
                      {pack.system_context.system_name || "No host"} · {pack.event.type} · r{pack.revision} ·{" "}
                      {formatWhen(pack.updated_at)}
                    </div>
                    <PackBoardStrip pack={pack} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
