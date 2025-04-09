import fs from "fs";
import path from "path";
import { processMDX } from "../src/lib/mdx-utils";
import type { PostMeta } from "../src/lib/mdx";
import { getAllDocs } from "../src/docs/_meta";

// Base URL for the site
const SITE_URL = "https://mirascope.com";

// Define static routes - update this when adding new static pages
const STATIC_ROUTES = [
  "/", // Home
  "/blog", // Blog index
  "/docs", // Docs index
  "/docs/mirascope", // Mirascope docs
  "/docs/lilypad", // Lilypad docs
  "/pricing", // Pricing page
  "/privacy", // Privacy policy
  "/terms", // Terms index
  "/terms/service", // Terms of service
  "/terms/use", // Terms of use
];

// Create static directories directly in public folder
// This ensures they get copied to the right place in the final build
const STATIC_DIR = path.join(process.cwd(), "public", "static");
const POSTS_DIR = path.join(STATIC_DIR, "posts");
const DOCS_DIR = path.join(STATIC_DIR, "docs");
const POLICIES_DIR = path.join(STATIC_DIR, "policies");
const TERMS_DIR = path.join(POLICIES_DIR, "terms");

fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(POLICIES_DIR, { recursive: true });
fs.mkdirSync(TERMS_DIR, { recursive: true });

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(source: string): {
  content: string;
  frontmatter: Record<string, string>;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = source.match(frontmatterRegex);

  if (!match) {
    return { content: source, frontmatter: {} };
  }

  const frontmatterStr = match[1];
  const content = match[2];

  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1");
      frontmatter[key] = value;
    }
  }

  return { content, frontmatter };
}

/**
 * Process all blog posts
 */
async function processBlogPosts(): Promise<void> {
  console.log("Processing blog posts...");
  const postsDir = path.join(process.cwd(), "src", "posts");
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));

  const postsList: PostMeta[] = [];

  for (const filename of files) {
    const slug = filename.replace(/\.mdx$/, "");
    const filepath = path.join(postsDir, filename);
    const fileContent = fs.readFileSync(filepath, "utf-8");

    // Extract frontmatter
    const { frontmatter } = extractFrontmatter(fileContent);

    // Check if MDX can be processed - we don't use the result but this ensures it's valid MDX
    try {
      await processMDX(fileContent);
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
      continue;
    }

    const postMeta: PostMeta = {
      title: frontmatter.title || "",
      description: frontmatter.description || "",
      date: frontmatter.date || "",
      readTime: frontmatter.readTime || "",
      author: frontmatter.author || "Mirascope Team",
      slug,
      ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
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

  console.log(`Processed ${postsList.length} blog posts`);
}

/**
 * Process all docs files
 */
async function processDocsFiles(): Promise<void> {
  console.log("Processing docs files...");
  const docsDir = path.join(process.cwd(), "src", "docs");
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
          const { frontmatter } = extractFrontmatter(fileContent);

          // Just check if the MDX is valid by attempting to process it
          await processMDX(fileContent);

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
          console.error(`Error processing doc ${filePath}:`, error);
        }
      }
    }
  }

  await processDirectory(docsDir);

  // Write the docs index
  fs.writeFileSync(path.join(STATIC_DIR, "docs-index.json"), JSON.stringify(docsIndex));

  console.log(`Processed ${Object.keys(docsIndex).length} doc files`);
}

/**
 * Process policy files
 */
async function processPolicyFiles(): Promise<void> {
  console.log("Processing policy files...");

  // Privacy policy
  const privacyPath = path.join(process.cwd(), "src", "policies", "privacy.mdx");
  if (fs.existsSync(privacyPath)) {
    const fileContent = fs.readFileSync(privacyPath, "utf-8");
    try {
      const { frontmatter } = extractFrontmatter(fileContent);
      await processMDX(fileContent); // Validate the MDX
      fs.writeFileSync(
        path.join(POLICIES_DIR, "privacy.json"),
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
  const termsDir = path.join(process.cwd(), "src", "policies", "terms");
  if (fs.existsSync(termsDir)) {
    const files = fs.readdirSync(termsDir).filter((file) => file.endsWith(".mdx"));
    for (const filename of files) {
      const filepath = path.join(termsDir, filename);
      const fileContent = fs.readFileSync(filepath, "utf-8");
      try {
        const { frontmatter } = extractFrontmatter(fileContent);
        await processMDX(fileContent); // Validate the MDX
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
async function generateSitemap(): Promise<void> {
  console.log("Generating sitemap.xml...");

  // Get blog post routes from the processed content
  const postsListPath = path.join(STATIC_DIR, "posts-list.json");
  const postsList: PostMeta[] = JSON.parse(fs.readFileSync(postsListPath, "utf-8"));
  const blogRoutes = postsList.map((post) => `/blog/${post.slug}`);

  // Get doc routes from the _meta.ts structure
  const allDocs = getAllDocs();
  const docRoutes = allDocs.map((doc) => {
    if (doc.path === "index") {
      return `/docs/${doc.product}`;
    } else {
      return `/docs/${doc.product}/${doc.path}`;
    }
  });

  // Combine all routes and remove duplicates
  const allRoutes = [...STATIC_ROUTES, ...blogRoutes, ...docRoutes];
  const uniqueRoutes = [...new Set(allRoutes)].sort();

  // Generate sitemap XML
  const today = new Date().toISOString().split("T")[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add each URL
  uniqueRoutes.forEach((route) => {
    xml += "  <url>\n";
    xml += `    <loc>${SITE_URL}${route}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "  </url>\n";
  });

  xml += "</urlset>";

  // Write to file
  const outFile = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outFile, xml);

  console.log(`Sitemap generated with ${uniqueRoutes.length} URLs`);
}

/**
 * Main processing function that generates static JSON files for all MDX content
 * and creates a sitemap.xml file
 */
async function preprocessContent(): Promise<void> {
  try {
    await processBlogPosts();
    await processDocsFiles();
    await processPolicyFiles();
    await generateSitemap();
    console.log("Content preprocessing complete!");
    console.log("Static files are available in the public/static directory");
  } catch (error) {
    console.error("Error during preprocessing:", error);
    process.exit(1);
  }
}

// Run the preprocessing when this script is executed
preprocessContent();
