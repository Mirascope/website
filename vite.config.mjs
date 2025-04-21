import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import { contentMiddlewarePlugin } from "./scripts/content-middleware";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    contentMiddlewarePlugin(),
  ],
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./"),
    },
  },
  // Add node-specific configuration for fs and path
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    exclude: ["src/posts/*.mdx", "src/docs/*.mdx"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
