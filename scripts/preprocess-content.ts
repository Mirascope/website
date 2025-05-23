import fs from "fs";
import path from "path";
import { ContentPreprocessor } from "@/src/lib/content/preprocess";
import { SITE_URL, getAllRoutes } from "@/src/lib/router-utils";
import type { BlogMeta } from "@/src/lib/content";

/**
 * Main processing function that generates static JSON files for all MDX content
 * and creates a sitemap.xml file
 */
export async function preprocessContent(verbose = true): Promise<void> {
  try {
    const preprocessor = new ContentPreprocessor(process.cwd(), verbose);
    await preprocessor.processAllContent();
    await generateSitemap(preprocessor.getMetadataByType().blog);
    return;
  } catch (error) {
    console.error("Error during preprocessing:", error);
    throw error; // Let the caller handle the error
  }
}

/**
 * Generate sitemap.xml file based on the processed content
 */
async function generateSitemap(blogPosts: BlogMeta[]): Promise<void> {
  console.log("Generating sitemap.xml...");

  // Get all routes using our centralized utility
  const uniqueRoutes = getAllRoutes();

  // Use the blog posts metadata
  const postsList = blogPosts || [];

  // Current date for default lastmod
  const today = new Date().toISOString().split("T")[0];

  // Get the date of the latest blog post for the /blog route
  const latestBlogDate =
    postsList.length > 0 ? postsList[0].lastUpdated || postsList[0].date : today;

  // Generate sitemap XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add llms_full.txt to the sitemap
  xml += "  <url>\n";
  xml += `    <loc>${SITE_URL}/llms_full.txt</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += "    <changefreq>daily</changefreq>\n";
  xml += "  </url>\n";

  // Add each URL
  uniqueRoutes.forEach((route) => {
    xml += "  <url>\n";
    xml += `    <loc>${SITE_URL}${route}</loc>\n`;

    // Set lastmod based on whether it's a blog post, blog index, or other page
    if (route === "/blog") {
      xml += `    <lastmod>${latestBlogDate}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
    } else if (route.startsWith("/blog/")) {
      // Find the post to get its lastUpdated date
      const postSlug = route.replace("/blog/", "");
      const post = postsList.find((p) => p.slug === postSlug);
      if (post) {
        xml += `    <lastmod>${post.lastUpdated || post.date}</lastmod>\n`;
      } else {
        xml += `    <lastmod>${today}</lastmod>\n`;
      }
      xml += "    <changefreq>weekly</changefreq>\n";
    } else {
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
    }

    xml += "  </url>\n";
  });

  xml += "</urlset>";

  // Write to file
  const outFile = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outFile, xml);

  console.log(`Sitemap generated with ${uniqueRoutes.length + 1} URLs (including llms_full.txt)`);
}

// Vite server interface for TypeScript
interface ViteDevServer {
  httpServer?: {
    once(event: string, callback: () => void): void;
  };
  watcher: {
    add(path: string): void;
    on(event: string, callback: (path: string) => void): void;
  };
}

export function contentPreprocessPlugin(options = { verbose: true }) {
  // Get all content directories
  const contentDirs = ["blog", "docs", "policy", "dev"].map((type) =>
    path.join(process.cwd(), "content", type)
  );

  return {
    name: "content-preprocess-plugin",
    // Only apply during development
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const { verbose } = options;

      // Run preprocessing when the server starts
      server.httpServer?.once("listening", async () => {
        if (verbose) console.log("Initial content preprocessing for development...");
        await preprocessContent(verbose).catch((error) => {
          console.error("Error preprocessing content:", error);
        });
      });

      // Create the base content directory if it doesn't exist
      const baseContentDir = path.join(process.cwd(), "content");
      if (!fs.existsSync(baseContentDir)) {
        fs.mkdirSync(baseContentDir, { recursive: true });
      }

      // Always watch the base content directory
      server.watcher.add(baseContentDir);

      // Set up watching on content directories
      contentDirs.forEach((dir) => {
        // Create the directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (verbose) console.log(`Watching directory for changes: ${dir}`);
        server.watcher.add(dir);
      });

      // React to content changes - these will work for any content directory
      server.watcher.on("change", async (filePath: string) => {
        if (filePath.endsWith(".mdx") && filePath.includes("/content/")) {
          if (verbose) console.log(`Content file changed: ${filePath}`);
          await preprocessContent(false).catch((error) => {
            console.error("Error preprocessing content after file change:", error);
          });
        }
      });

      server.watcher.on("add", async (filePath: string) => {
        if (filePath.endsWith(".mdx") && filePath.includes("/content/")) {
          if (verbose) console.log(`Content file added: ${filePath}`);
          await preprocessContent(false).catch((error) => {
            console.error("Error preprocessing content after file add:", error);
          });
        }
      });

      server.watcher.on("unlink", async (filePath: string) => {
        if (filePath.endsWith(".mdx") && filePath.includes("/content/")) {
          if (verbose) console.log(`Content file deleted: ${filePath}`);
          await preprocessContent(false).catch((error) => {
            console.error("Error preprocessing content after file delete:", error);
          });
        }
      });
    },
  };
}

// Run the preprocessing when this script is executed directly
if (import.meta.main) {
  preprocessContent().catch((error) => {
    console.error("Fatal error during preprocessing:", error);
    process.exit(1);
  });
}
