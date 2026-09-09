import { Link } from "@tanstack/react-router";

export function AppErrorComponent({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <main className="mx-auto max-w-xl px-4 py-16 grid gap-4">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="text-sm text-fg-muted whitespace-pre-wrap">{message}</p>
      <Link to="/" className="text-accent underline">
        Back to packs
      </Link>
    </main>
  );
}
