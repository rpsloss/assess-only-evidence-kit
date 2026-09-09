import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": join(root, "src"),
    },
  },
  plugins: [tanstackStart(), viteReact(), tailwindcss()],
});
