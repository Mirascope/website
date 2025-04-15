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
      // Create a virtual endpoint to list all posts with their metadata
      server.middlewares.use("/api/posts-list", (req, res) => {
        try {
          const postsDir = resolve(process.cwd(), "src/posts");
          const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));
          
          // Convert files to BlogMeta objects
          const postsList = files.map(filename => {
            const slug = filename.replace(/\.mdx$/, "");
            const filePath = resolve(postsDir, filename);
            let meta = {
              title: slug.replace(/-/g, " "),  // Basic title from slug
              description: "",
              date: new Date().toISOString().split('T')[0],
              readTime: "3 min",
              author: "Mirascope Team",
              slug,
              path: `blog/${slug}`,
              type: "blog",
            };
            
            // Try to extract frontmatter for better metadata
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              const match = content.match(/^---\n([\s\S]*?)\n---\n/);
              
              if (match) {
                const frontmatterStr = match[1];
                const lines = frontmatterStr.split("\n");
                const frontmatter = {};
                
                for (const line of lines) {
                  const colonIndex = line.indexOf(":");
                  if (colonIndex !== -1) {
                    const key = line.slice(0, colonIndex).trim();
                    const value = line
                      .slice(colonIndex + 1)
                      .trim()
                      .replace(/^"(.*)"$/, "$1");
                    frontmatter[key] = value;
                  }
                }
                
                // Update meta with frontmatter values
                if (frontmatter.title) meta.title = frontmatter.title;
                if (frontmatter.description) meta.description = frontmatter.description;
                if (frontmatter.date) meta.date = frontmatter.date;
                if (frontmatter.readTime) meta.readTime = frontmatter.readTime;
                if (frontmatter.author) meta.author = frontmatter.author;
                if (frontmatter.lastUpdated) meta.lastUpdated = frontmatter.lastUpdated;
              }
            } catch (e) {
              console.warn(`Could not extract frontmatter for ${filename}:`, e);
            }
            
            return meta;
          });
          
          // Sort posts by date in descending order
          postsList.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(postsList));
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
          const postsDir = resolve(process.cwd(), "src/posts");
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
          const docsDir = resolve(process.cwd(), "src/docs");

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
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./src"),
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
