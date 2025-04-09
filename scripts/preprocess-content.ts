import fs from "fs";
import path from "path";
import { processMDX } from "../src/lib/mdx-utils";
import type { PostMeta } from "../src/lib/mdx";
import { getAllDocs } from "../src/docs/_meta";
import { execSync } from "child_process";

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
 * Get last modified date from Git
 */
function getLastModifiedDateFromGit(filePath: string): string | null {
  try {
    // Get the last commit date that modified this file
    const dateStr = execSync(`git log -1 --format="%ad" --date=short -- "${filePath}"`, {
      encoding: "utf-8",
    }).trim();

    // If we got a valid date, return it
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    return null;
  } catch (error) {
    console.error(`Error getting git history for ${filePath}:`, error);
    return null;
  }
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

    // Get last updated date from Git (for SEO only, not for display)
    const gitLastUpdated = getLastModifiedDateFromGit(filepath);

    // Create the post metadata - without including lastUpdated in what's displayed
    const postMeta: PostMeta = {
      title: frontmatter.title || "",
      description: frontmatter.description || "",
      date: frontmatter.date || "",
      readTime: frontmatter.readTime || "",
      author: frontmatter.author || "Mirascope Team",
      slug,
      // Don't include lastUpdated in the metadata so it won't be displayed
    };

    // Create an internal version of postMeta that includes the Git date
    // This will be used for the sitemap but not displayed to users
    const postMetaWithSeoData = {
      ...postMeta,
      _gitLastUpdated: gitLastUpdated, // Use underscore to indicate it's internal
    };

    postsList.push(postMetaWithSeoData);

    // Write individual post data to its own file - store raw content
    fs.writeFileSync(
      path.join(POSTS_DIR, `${slug}.json`),
      JSON.stringify({
        meta: postMeta, // Use the version WITHOUT lastUpdated for display
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
  const postsList: any[] = JSON.parse(fs.readFileSync(postsListPath, "utf-8"));

  // Create a map of routes to their last modified dates from Git
  const routeDates: Record<string, string> = {};
  const routeFrequency: Record<string, string> = {};

  // Add blog post routes with their lastUpdated dates
  postsList.forEach((post) => {
    const route = `/blog/${post.slug}`;
    // Use Git lastUpdated if available, otherwise use publication date
    routeDates[route] = post._gitLastUpdated || post.date;
    // Set blog posts to weekly
    routeFrequency[route] = "weekly";
  });

  const blogRoutes = postsList.map((post) => `/blog/${post.slug}`);

  // Get doc routes from the _meta.ts structure
  const allDocs = getAllDocs();
  const docRoutes = allDocs.map((doc) => {
    const route =
      doc.path === "index" ? `/docs/${doc.product}` : `/docs/${doc.product}/${doc.path}`;
    // Set doc pages to weekly
    routeFrequency[route] = "weekly";
    return route;
  });

  // Combine all routes and remove duplicates
  const allRoutes = [...STATIC_ROUTES, ...blogRoutes, ...docRoutes];
  const uniqueRoutes = [...new Set(allRoutes)].sort();

  // Default date for routes without specific dates (today's date)
  const today = new Date().toISOString().split("T")[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add each URL
  uniqueRoutes.forEach((route) => {
    xml += "  <url>\n";
    xml += `    <loc>${SITE_URL}${route}</loc>\n`;

    // Use the specific date for this route if available, otherwise use today
    const lastmod = routeDates[route] || today;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;

    // Use appropriate changefreq based on route type
    const changefreq = routeFrequency[route] || "daily";
    xml += `    <changefreq>${changefreq}</changefreq>\n`;

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
