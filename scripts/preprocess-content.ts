import fs from "fs";
import path from "path";
import type { BlogMeta } from "../src/lib/content/blog";
import { SITE_URL, getAllRoutes, getBlogPostsWithMeta } from "../src/lib/router-utils";
import { parseFrontmatter } from "../src/lib/content/frontmatter";

// Create static directories directly in public folder
// This ensures they get copied to the right place in the final build
const STATIC_DIR = path.join(process.cwd(), "public", "static");
const POSTS_DIR = path.join(STATIC_DIR, "posts");
const DOCS_DIR = path.join(STATIC_DIR, "docs");
const POLICIES_DIR = path.join(STATIC_DIR, "policies");
const TERMS_DIR = path.join(POLICIES_DIR, "terms");
const DEV_DIR = path.join(STATIC_DIR, "dev");

fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(POLICIES_DIR, { recursive: true });
fs.mkdirSync(TERMS_DIR, { recursive: true });
fs.mkdirSync(DEV_DIR, { recursive: true });

/**
 * Process all blog posts
 */
async function processBlogPosts(verbose = true): Promise<void> {
  if (verbose) console.log("Processing blog posts...");
  const postsDir = path.join(process.cwd(), "content", "blog");
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));

  const postsList: BlogMeta[] = [];

  for (const filename of files) {
    const slug = filename.replace(/\.mdx$/, "");
    const filepath = path.join(postsDir, filename);
    const fileContent = fs.readFileSync(filepath, "utf-8");

    // Extract frontmatter
    const { frontmatter } = parseFrontmatter(fileContent);

    const postMeta: BlogMeta = {
      title: frontmatter.title || "",
      description: frontmatter.description || "",
      date: frontmatter.date || "",
      readTime: frontmatter.readTime || "",
      author: frontmatter.author || "Mirascope Team",
      slug,
      path: `blog/${slug}`,
      type: "blog",
      lastUpdated: frontmatter.lastUpdated || frontmatter.date || "",
    };

    postsList.push(postMeta);

    // Write individual post data to its own file - store raw content
    fs.writeFileSync(
      path.join(POSTS_DIR, `${slug}.json`),
      JSON.stringify({
        meta: postMeta,
        content: fileContent, // Store the original MDX content
      })
    );
  }

  // Sort posts by date in descending order
  postsList.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Write just the metadata to the posts list
  fs.writeFileSync(path.join(STATIC_DIR, "posts-list.json"), JSON.stringify(postsList));

  if (verbose) console.log(`Processed ${postsList.length} blog posts`);
}

/**
 * Process all docs files
 */
async function processDocsFiles(verbose = true): Promise<void> {
  if (verbose) console.log("Processing docs files...");
  const docsDir = path.join(process.cwd(), "content", "doc");
  const docsIndex: Record<string, { path: string }> = {};

  // Process docs directory recursively
  async function processDirectory(dirPath: string, baseDir = ""): Promise<void> {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const relPath = path.join(baseDir, item);

      if (fs.statSync(itemPath).isDirectory()) {
        await processDirectory(itemPath, relPath);
      } else if (item.endsWith(".mdx")) {
        const filePath = path.relative(docsDir, itemPath).replace(/\\/g, "/"); // Normalize for Windows
        const fileContent = fs.readFileSync(itemPath, "utf-8");

        try {
          // Extract frontmatter from the content
          const { frontmatter } = parseFrontmatter(fileContent);

          // Create directory path if it doesn't exist
          const dirName = path.dirname(path.join(DOCS_DIR, filePath));
          fs.mkdirSync(dirName, { recursive: true });

          // Write to individual file - store raw content
          fs.writeFileSync(
            path.join(DOCS_DIR, `${filePath}.json`),
            JSON.stringify({
              content: fileContent, // Store the original MDX content
              frontmatter: frontmatter,
            })
          );

          // Add to index - store just the file name without .mdx
          docsIndex[filePath.replace(/\.mdx$/, "")] = { path: `${filePath}.json` };
        } catch (error) {
          // Always log errors regardless of verbosity
          console.error(`Error processing doc ${filePath}:`, error);
        }
      }
    }
  }

  await processDirectory(docsDir);

  // Write the docs index
  fs.writeFileSync(path.join(STATIC_DIR, "docs-index.json"), JSON.stringify(docsIndex));

  if (verbose) console.log(`Processed ${Object.keys(docsIndex).length} doc files`);
}

/**
 * Process policy files
 */
async function processPolicyFiles(verbose = true): Promise<void> {
  if (verbose) console.log("Processing policy files...");

  // Privacy policy
  const privacyPath = path.join(process.cwd(), "content", "policy", "privacy.mdx");
  if (fs.existsSync(privacyPath)) {
    const fileContent = fs.readFileSync(privacyPath, "utf-8");
    try {
      const { frontmatter } = parseFrontmatter(fileContent);

      fs.writeFileSync(
        path.join(POLICIES_DIR, "privacy.mdx.json"),
        JSON.stringify({
          content: fileContent,
          frontmatter,
        })
      );
    } catch (error) {
      console.error(`Error processing privacy policy:`, error);
    }
  }

  // Terms files
  const termsDir = path.join(process.cwd(), "content", "policy", "terms");
  if (fs.existsSync(termsDir)) {
    const files = fs.readdirSync(termsDir).filter((file) => file.endsWith(".mdx"));
    for (const filename of files) {
      const filepath = path.join(termsDir, filename);
      const fileContent = fs.readFileSync(filepath, "utf-8");
      try {
        const { frontmatter } = parseFrontmatter(fileContent);

        fs.writeFileSync(
          path.join(TERMS_DIR, `${filename}.json`),
          JSON.stringify({
            content: fileContent,
            frontmatter,
          })
        );
      } catch (error) {
        console.error(`Error processing terms file ${filename}:`, error);
      }
    }
  }
}

/**
 * Generate sitemap.xml file based on the processed content
 */
async function generateSitemap(verbose = true): Promise<void> {
  if (verbose) console.log("Generating sitemap.xml...");

  // Get all routes using our centralized utility
  const uniqueRoutes = getAllRoutes();

  // Get blog posts metadata for setting lastmod dates
  const postsList = await getBlogPostsWithMeta();

  // Current date for default lastmod
  const today = new Date().toISOString().split("T")[0];

  // Get the date of the latest blog post for the /blog route
  const latestBlogDate =
    postsList.length > 0 ? postsList[0].lastUpdated || postsList[0].date : today;

  // Generate sitemap XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

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

  if (verbose) console.log(`Sitemap generated with ${uniqueRoutes.length} URLs`);
}

/**
 * Process developer tool content files
 */
async function processDevFiles(verbose = true): Promise<void> {
  if (verbose) console.log("Processing dev tools content...");

  // Process the style test MDX file
  const devDir = path.join(process.cwd(), "src", "components", "dev");
  const files = fs.readdirSync(devDir).filter((file) => file.endsWith(".mdx"));

  for (const filename of files) {
    const filepath = path.join(devDir, filename);
    const fileContent = fs.readFileSync(filepath, "utf-8");
    try {
      const { frontmatter } = parseFrontmatter(fileContent);

      // Output filename matches the input but with .json extension
      const outputPath = path.join(DEV_DIR, `${filename}.json`);

      fs.writeFileSync(
        outputPath,
        JSON.stringify({
          content: fileContent,
          frontmatter,
        })
      );
      if (verbose) console.log(`Processed dev file: ${filename}`);
    } catch (error) {
      console.error(`Error processing dev file ${filename}:`, error);
    }
  }

  if (verbose && files.length === 0) {
    console.log("No dev MDX files found at", devDir);
  }
}

/**
 * Main processing function that generates static JSON files for all MDX content
 * and creates a sitemap.xml file
 */
export async function preprocessContent(verbose = true): Promise<void> {
  try {
    await processBlogPosts(verbose);
    await processDocsFiles(verbose);
    await processPolicyFiles(verbose);
    await processDevFiles(verbose);
    await generateSitemap(verbose);
    if (verbose) {
      console.log("Content preprocessing complete!");
      console.log("Static files are available in the public/static directory");
    }
    return;
  } catch (error) {
    console.error("Error during preprocessing:", error);
    throw error; // Let the caller handle the error
  }
}

// Create a Vite plugin to run preprocessing and watch content dirs
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
  const contentDirs = [
    path.join(process.cwd(), "content"),
    path.join(process.cwd(), "src", "components", "dev"),
  ];

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

      // Watch content directories for changes
      contentDirs.forEach((dir) => {
        if (verbose) console.log(`Watching directory for changes: ${dir}`);

        server.watcher.add(dir);

        // Only process content files
        server.watcher.on("change", async (filePath: string) => {
          if (filePath.endsWith(".mdx") && filePath.includes(dir)) {
            if (verbose) console.log(`Content file changed: ${filePath}`);
            await preprocessContent(false).catch((error) => {
              console.error("Error preprocessing content after file change:", error);
            });
          }
        });

        server.watcher.on("add", async (filePath: string) => {
          if (filePath.endsWith(".mdx") && filePath.includes(dir)) {
            if (verbose) console.log(`Content file added: ${filePath}`);
            await preprocessContent(false).catch((error) => {
              console.error("Error preprocessing content after file add:", error);
            });
          }
        });

        server.watcher.on("unlink", async (filePath: string) => {
          if (filePath.endsWith(".mdx") && filePath.includes(dir)) {
            if (verbose) console.log(`Content file deleted: ${filePath}`);
            await preprocessContent(false).catch((error) => {
              console.error("Error preprocessing content after file delete:", error);
            });
          }
        });
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
