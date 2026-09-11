import { HeadContent, Outlet, Scripts, createRootRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { hydratePackStore } from "@/lib/store";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Assess-Only Evidence Kit" },
      { name: "theme-color", content: "#070708" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    hydratePackStore();
  }, []);

  return (
    <RootDocument>
      <div className="bg-paper-2 text-accent text-center text-[11px] tracking-[0.22em] uppercase py-1.5 border-b border-rule">
        Unclassified · sample · not an ATO
      </div>
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="brand-lockup text-fg no-underline">
            <BrandMark />
            <span>
              <span className="brand-org">Castleridge</span>
              <span className="font-serif text-xl block leading-tight">Assess-Only Kit</span>
            </span>
          </Link>
          <p className="text-xs text-fg-muted max-w-xl">
            Host platform holds the ATO. The model is incorporated via RMF Assess Only. Packs stay in this
            browser until you download them. The zip stays a document; this screen is the assembler.
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
