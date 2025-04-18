import fs from "fs";
import path from "path";
import type { BlogMeta } from "../src/lib/content/blog";
import { SITE_URL, getAllRoutes, getBlogPostsWithMeta } from "../src/lib/router-utils";
import { processMDXContent } from "../src/lib/content/mdx-processor";
import { prerenderPage } from "./lib/prerender";

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
async function processBlogPosts(verbose = true): Promise<void> {
  if (verbose) console.log("Processing blog posts...");
  const postsDir = path.join(process.cwd(), "src", "posts");
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));

  const postsList: BlogMeta[] = [];

  for (const filename of files) {
    const slug = filename.replace(/\.mdx$/, "");
    const filepath = path.join(postsDir, filename);
    const fileContent = fs.readFileSync(filepath, "utf-8");

    // Extract frontmatter
    const { frontmatter } = extractFrontmatter(fileContent);

    // Check if MDX can be processed - we don't use the result but this ensures it's valid MDX
    try {
      await processMDXContent(fileContent);
    } catch (error) {
      // Always log errors regardless of verbosity
      console.error(`Error processing ${filename}:`, error);
      continue;
    }

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
  const docsDir = path.join(process.cwd(), "src", "docs");
  const docsIndex: Record<string, { path: string }> = {};

  // Process docs directory recursively
  async function processDirectory(dirPath: string, baseDir = ""): Promise<void> {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const relPath = path.join(baseDir, item);

      // Skip the disabled-guides-wip directory
      if (item === "disabled-guides-wip" || relPath.includes("disabled-guides-wip")) {
        continue;
      }

      if (fs.statSync(itemPath).isDirectory()) {
        await processDirectory(itemPath, relPath);
      } else if (item.endsWith(".mdx")) {
        const filePath = path.relative(docsDir, itemPath).replace(/\\/g, "/"); // Normalize for Windows
        const fileContent = fs.readFileSync(itemPath, "utf-8");

        try {
          // Extract frontmatter from the content
          const { frontmatter } = extractFrontmatter(fileContent);

          // Just check if the MDX is valid by attempting to process it
          await processMDXContent(fileContent);

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
  const privacyPath = path.join(process.cwd(), "src", "policies", "privacy.mdx");
  if (fs.existsSync(privacyPath)) {
    const fileContent = fs.readFileSync(privacyPath, "utf-8");
    try {
      const { frontmatter } = extractFrontmatter(fileContent);
      await processMDXContent(fileContent); // Validate the MDX
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
  const termsDir = path.join(process.cwd(), "src", "policies", "terms");
  if (fs.existsSync(termsDir)) {
    const files = fs.readdirSync(termsDir).filter((file) => file.endsWith(".mdx"));
    for (const filename of files) {
      const filepath = path.join(termsDir, filename);
      const fileContent = fs.readFileSync(filepath, "utf-8");
      try {
        const { frontmatter } = extractFrontmatter(fileContent);
        await processMDXContent(fileContent); // Validate the MDX
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
  const uniqueRoutes = await getAllRoutes();

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
  const styleTestPath = path.join(process.cwd(), "src", "components", "dev", "style-test.mdx");
  if (fs.existsSync(styleTestPath)) {
    const fileContent = fs.readFileSync(styleTestPath, "utf-8");
    try {
      const { frontmatter } = extractFrontmatter(fileContent);
      await processMDXContent(fileContent); // Validate the MDX
      fs.writeFileSync(
        path.join(DEV_DIR, "style-test.mdx.json"),
        JSON.stringify({
          content: fileContent,
          frontmatter,
        })
      );
      if (verbose) console.log("Processed style test MDX file");
    } catch (error) {
      console.error(`Error processing style test MDX:`, error);
    }
  } else if (verbose) {
    console.log("Style test MDX file not found at", styleTestPath);
  }
}

/**
 * Prerender all routes to static HTML
 */
async function prerenderAllRoutes(verbose = true): Promise<void> {
  if (verbose) console.log("Prerendering all routes to static HTML...");

  // Define the output directory for prerenders
  const outputDir = path.join(process.cwd(), "public", "ssg");

  // Create the directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Get all routes
  const routes = await getAllRoutes();
  let successCount = 0;
  let failureCount = 0;

  // Process each route
  for (const route of routes) {
    try {
      if (verbose) console.log(`Prerendering ${route}...`);
      await prerenderPage(route, outputDir, false);
      successCount++;
    } catch (error) {
      console.error(`Error prerendering ${route}:`, error);
      failureCount++;
    }
  }

  if (verbose) {
    console.log(`Prerendering complete.`);
    console.log(`Successfully prerendered ${successCount} routes.`);
    if (failureCount > 0) {
      console.log(`Failed to prerender ${failureCount} routes.`);
    }
  }
}

/**
 * Main processing function that generates static JSON files for all MDX content,
 * creates a sitemap.xml file, and prerenders all routes to static HTML
 */
export async function preprocessContent(verbose = true): Promise<void> {
  try {
    // First process all content to make sure it's available for prerendering
    await processBlogPosts(verbose);
    await processDocsFiles(verbose);
    await processPolicyFiles(verbose);
    await processDevFiles(verbose);
    await generateSitemap(verbose);

    // Then prerender all routes to static HTML
    await prerenderAllRoutes(verbose);

    if (verbose) {
      console.log("Content preprocessing complete!");
      console.log("Static JSON files are available in the public/static directory");
      console.log("Prerendered HTML files are available in the public/ssg directory");
    }
    return;
  } catch (error) {
    console.error("Error during preprocessing:", error);
    throw error; // Let the caller handle the error
  }
}

// Run the preprocessing when this script is executed directly
if (import.meta.main) {
  preprocessContent().catch((error) => {
    console.error("Fatal error during preprocessing:", error);
    process.exit(1);
  });
}
