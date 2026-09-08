import { createFileRoute, Link } from "@tanstack/react-router";
import { PackEditor } from "@/components/pack-editor";
import { usePackStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pack/$packId")({
  component: PackPage,
});

function PackPage() {
  const { packId } = Route.useParams();
  const hydrated = usePackStore((s) => s.hydrated);
  const pack = usePackStore((s) => s.packs[packId]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-sm text-fg-muted">
        Loading pack…
      </main>
    );
  }

  if (!pack) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 grid gap-4">
        <h1 className="font-serif text-3xl">Pack not found</h1>
        <p className="text-fg-muted text-sm max-w-lg">
          This identifier is not in local storage. It may have been deleted, or you opened
          a link from another workstation.
        </p>
        <div>
          <Button asChild>
            <Link to="/">Back to packs</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <PackEditor pack={pack} />;
}
