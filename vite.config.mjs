import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import { optimizedImageMiddleware } from "./scripts/optimized-image-middleware";
import { contentPreprocessPlugin } from "./scripts/preprocess-content";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    contentPreprocessPlugin(),
    optimizedImageMiddleware(),
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
    exclude: ["content"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
  
  // Keeping the default build configuration
  build: {
    assetsInlineLimit: 4096, // Default inline limit
  },
});
