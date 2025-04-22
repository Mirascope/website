import fs from "fs";
import path from "path";
import { glob } from "glob";
import { CONTENT_TYPES } from "../src/lib/content/content-types";
import type { ContentType } from "../src/lib/content/content-types";
import { SITE_URL, getAllRoutes } from "../src/lib/router-utils";
import { parseFrontmatter } from "../src/lib/content/frontmatter";

// Create static directories directly in public folder
// This ensures they get copied to the right place in the final build
const STATIC_DIR = path.join(process.cwd(), "public", "static");
const CONTENT_DIR = path.join(STATIC_DIR, "content");
const META_DIR = path.join(STATIC_DIR, "content-meta");

// Create base content and metadata directories
fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });
fs.mkdirSync(META_DIR, { recursive: true });

/**
 * Interface for content metadata
 */
interface ContentMetadata {
  type: string;
  slug: string;
  path: string;
  [key: string]: any;
}

/**
 * ContentPreprocessor - A class that handles preprocessing of MDX content files
 * into static JSON files for consumption by the frontend.
 */
class ContentPreprocessor {
  // Base directories
  private readonly baseDir: string;
  private readonly staticDir: string;
  private readonly contentDir: string;
  private readonly metaDir: string;

  // Content tracking
  private metadataByType: Record<string, ContentMetadata[]> = {};
  private verbose: boolean;

  /**
   * Constructor - initializes directory structure and metadata tracking
   */
  constructor(verbose = true) {
    this.verbose = verbose;
    this.baseDir = process.cwd();

    // Create static directories directly in public folder
    // This ensures they get copied to the right place in the final build
    this.staticDir = path.join(this.baseDir, "public", "static");
    this.contentDir = path.join(this.staticDir, "content");
    this.metaDir = path.join(this.staticDir, "content-meta");

    // Initialize directory structure
    this.initializeDirectories();

    // Initialize metadata tracking
    this.initializeMetadataTracking();
  }

  /**
   * Create necessary directory structure
   */
  private initializeDirectories(): void {
    // Create base directories
    fs.mkdirSync(this.staticDir, { recursive: true });
    fs.mkdirSync(this.contentDir, { recursive: true });
    fs.mkdirSync(this.metaDir, { recursive: true });

    // Create content type directories
    for (const contentType of CONTENT_TYPES) {
      fs.mkdirSync(path.join(this.contentDir, contentType), { recursive: true });
      fs.mkdirSync(path.join(this.metaDir, contentType), { recursive: true });
    }
  }

  /**
   * Initialize metadata tracking for all content types
   */
  private initializeMetadataTracking(): void {
    for (const contentType of CONTENT_TYPES) {
      this.metadataByType[contentType] = [];
    }
  }

  /**
   * Process all content types
   */
  async processAllContent(): Promise<Record<string, ContentMetadata[]>> {
    if (this.verbose) console.log("Processing all content...");

    // Process each content type
    for (const contentType of CONTENT_TYPES) {
      await this.processContentType(contentType);
    }

    // Sort blog posts by date if they exist
    this.sortBlogPosts();

    // Write metadata files
    this.writeMetadataFiles();

    return this.metadataByType;
  }

  /**
   * Process a specific content type
   */
  async processContentType(contentType: ContentType): Promise<void> {
    if (this.verbose) console.log(`Processing ${contentType} content...`);

    const srcDir = path.join(this.baseDir, "content", contentType);

    // Skip if source directory doesn't exist
    if (!fs.existsSync(srcDir)) {
      if (this.verbose) console.error(`Source directory for ${contentType} not found: ${srcDir}`);
      return;
    }

    // Process this content type's directory recursively
    await this.processContentDirectory(srcDir, contentType);
  }

  /**
   * Process a content directory using glob to find all MDX files
   */
  async processContentDirectory(srcDir: string, contentType: ContentType): Promise<void> {
    // Create output directory for this content type if it doesn't exist
    const outputBase = path.join(this.contentDir, contentType);
    fs.mkdirSync(outputBase, { recursive: true });

    // Use glob to find all MDX files in the source directory
    const mdxFiles = await glob(path.join(srcDir, "**/*.mdx"));

    if (this.verbose) {
      console.log(`Found ${mdxFiles.length} MDX files for ${contentType}`);
    }

    // Process each MDX file
    for (const filePath of mdxFiles) {
      await this.processMdxFile(filePath, srcDir, contentType, outputBase);
    }
  }

  /**
   * Process a single MDX file
   */
  private async processMdxFile(
    filePath: string,
    srcDir: string,
    contentType: ContentType,
    outputBase: string
  ): Promise<void> {
    try {
      // Read and parse file
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { frontmatter } = parseFrontmatter(fileContent);

      // Get the relative path from the source directory
      const relativePath = path.relative(srcDir, filePath);

      // Get the file name without extension
      const slug = path.basename(filePath, ".mdx");

      // Build the output path based on directory structure
      // Remove .mdx extension to get the clean path
      const outputPath = relativePath.replace(/\.mdx$/, "");

      // Create metadata object
      const metadata: ContentMetadata = {
        type: contentType,
        slug: slug,
        path: `${contentType}/${outputPath}`,
        title: frontmatter.title || slug,
        ...frontmatter,
      };

      // Special handling for blog posts
      if (contentType === "blog") {
        metadata.author = frontmatter.author || "Mirascope Team";
        metadata.lastUpdated = frontmatter.lastUpdated || frontmatter.date || "";
        metadata.readTime = frontmatter.readTime || "";
      }

      // Add to metadata map
      this.metadataByType[contentType].push(metadata);

      // Create output directory if needed
      const outputDir = path.dirname(path.join(outputBase, `${outputPath}.json`));
      fs.mkdirSync(outputDir, { recursive: true });

      // Write content file with metadata
      fs.writeFileSync(
        path.join(outputBase, `${outputPath}.json`),
        JSON.stringify({
          meta: metadata,
          content: fileContent,
          frontmatter,
        })
      );

      if (this.verbose) console.log(`Processed ${contentType} file: ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${contentType} file ${filePath}:`, error);
    }
  }

  /**
   * Sort blog posts by date (newest first)
   */
  private sortBlogPosts(): void {
    if (this.metadataByType.blog && this.metadataByType.blog.length > 0) {
      this.metadataByType.blog.sort((a, b) => {
        return new Date(b.date || "").getTime() - new Date(a.date || "").getTime();
      });

      if (this.verbose) {
        console.log(`Sorted ${this.metadataByType.blog.length} blog posts by date`);
      }
    }
  }

  /**
   * Write metadata index files for each content type
   */
  private writeMetadataFiles(): void {
    for (const contentType of CONTENT_TYPES) {
      const metadataList = this.metadataByType[contentType];
      if (metadataList && metadataList.length > 0) {
        // Write index file
        fs.writeFileSync(
          path.join(this.metaDir, contentType, "index.json"),
          JSON.stringify(metadataList)
        );

        if (this.verbose) {
          console.log(
            `Created metadata index for ${contentType} with ${metadataList.length} items`
          );
        }
      }
    }
  }

  /**
   * Generate sitemap.xml file based on the processed content
   */
  async generateSitemap(): Promise<void> {
    if (this.verbose) console.log("Generating sitemap.xml...");

    // Get all routes using our centralized utility
    const uniqueRoutes = getAllRoutes();

    // Use the already collected blog posts metadata
    const postsList = this.metadataByType.blog || [];

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
    const outFile = path.join(this.baseDir, "public", "sitemap.xml");
    fs.writeFileSync(outFile, xml);

    if (this.verbose) console.log(`Sitemap generated with ${uniqueRoutes.length} URLs`);
  }

  /**
   * Process all content and generate sitemap
   */
  async run(): Promise<void> {
    try {
      await this.processAllContent();
      await this.generateSitemap();

      if (this.verbose) {
        console.log("Content preprocessing complete!");
        console.log("Static files are available in the public/static directory");
      }
    } catch (error) {
      console.error("Error during preprocessing:", error);
      throw error;
    }
  }
}

/**
 * Main processing function that generates static JSON files for all MDX content
 * and creates a sitemap.xml file
 */
export async function preprocessContent(verbose = true): Promise<void> {
  try {
    const preprocessor = new ContentPreprocessor(verbose);
    await preprocessor.run();
    return;
  } catch (error) {
    console.error("Error during preprocessing:", error);
    throw error; // Let the caller handle the error
  }
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
  const contentDirs = CONTENT_TYPES.map((type) => path.join(process.cwd(), "content", type));

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
