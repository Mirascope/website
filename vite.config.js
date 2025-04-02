import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import fs from "node:fs";

// Custom plugin to handle dynamic MDX file loading in dev server
const mdxVirtualModulePlugin = () => {
  return {
    name: "mdx-virtual-module-plugin",
    configureServer(server) {
      // Create a virtual endpoint to list all posts
      server.middlewares.use("/api/posts-list", (req, res) => {
        try {
          const postsDir = resolve(__dirname, "src/posts");
          const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
        } catch (error) {
          console.error("Error listing posts:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to list posts" }));
        }
      });

      // Create a virtual endpoint to serve post content
      server.middlewares.use("/posts/", (req, res, next) => {
        const filename = req.url.split("/").pop();

        if (!filename || !filename.endsWith(".mdx")) {
          return next();
        }

        try {
          const postsDir = resolve(__dirname, "src/posts");
          const filePath = resolve(postsDir, filename);

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Post not found" }));
          }

          const content = fs.readFileSync(filePath, "utf-8");

          res.setHeader("Content-Type", "text/plain");
          res.end(content);
        } catch (error) {
          console.error(`Error serving post ${filename}:`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to serve post content" }));
        }
      });

      // Serve documentation MDX files from src/docs directory
      server.middlewares.use("/src/docs/", (req, res, next) => {
        // The URL will be something like /src/docs/mirascope/index.mdx
        const urlPath = req.url;

        // Skip if not an MDX file
        if (!urlPath.endsWith(".mdx")) {
          return next();
        }

        try {
          // Resolve to the actual file path in the filesystem
          const docsDir = resolve(__dirname, "src/docs");

          // Extract the relative path from the URL
          // Remove leading slash if present
          const relativePath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;

          // Construct the full file path
          const filePath = resolve(docsDir, relativePath);

          console.log(`Serving documentation file: ${filePath}`);

          if (!fs.existsSync(filePath)) {
            console.error(`Documentation file not found: ${filePath}`);
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Documentation file not found" }));
          }

          const content = fs.readFileSync(filePath, "utf-8");

          res.setHeader("Content-Type", "text/plain");
          res.end(content);
        } catch (error) {
          console.error(`Error serving documentation file ${urlPath}:`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to serve documentation content" }));
        }
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    mdxVirtualModulePlugin(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
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
