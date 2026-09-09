import { HeadContent, Outlet, Scripts, createRootRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { hydratePackStore } from "@/lib/store";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Assess-Only Evidence Kit" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    hydratePackStore();
  }, []);

  return (
    <RootDocument>
      <div className="bg-banner text-white text-center text-[11px] tracking-[0.35em] uppercase py-1">
        Unclassified — not an ATO
      </div>
      <header className="border-b border-rule bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-baseline justify-between gap-3">
          <Link to="/" className="font-serif text-xl">
            Assess-Only Evidence Kit
          </Link>
          <p className="text-xs text-fg-muted max-w-xl">
            Host platform holds the ATO. The model is incorporated via RMF Assess Only. Packs stay in this
            browser until you download them.
          </p>
        </div>
      </header>
      <Outlet />
      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-fg-muted">
        Public doctrine only. Reciprocity only where Component policy allows. No eMASS write. No
        DoDD 3000.09 coverage. Fictional sample — not a real ATO.
      </footer>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
