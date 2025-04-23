import fs from "fs";
import path from "path";
import { glob } from "glob";
import {
  CONTENT_TYPES,
  type ContentType,
  type ContentMeta,
  type BlogMeta,
  type DocMeta,
  type PolicyMeta,
} from "./content-types";
import { parseFrontmatter } from "./frontmatter";

/**
 * Path representation for consistent handling across the application
 */
export interface ContentPath {
  // The complete path with content type prefix (e.g., "blog/my-post")
  typePath: string;

  // The path after content type (e.g., "my-post" for "blog/my-post")
  subpath: string;

  // The last segment of the path, typically the filename without extension
  slug: string;
}

/**
 * ContentPreprocessor - A class that handles preprocessing of MDX content files
 * into static JSON files with validated metadata.
 */
export class ContentPreprocessor {
  // Base directories
  private readonly baseDir: string;
  private readonly staticDir: string;
  private readonly contentDir: string;
  private readonly metaDir: string;

  // Content tracking with type-specific collections
  private blogMetadata: BlogMeta[] = [];
  private docMetadata: DocMeta[] = [];
  private policyMetadata: PolicyMeta[] = [];
  private devMetadata: ContentMeta[] = [];

  // Track errors for reporting
  private errors: string[] = [];

  // Validation pattern for filenames/slugs
  private static readonly VALID_SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
  private verbose: boolean;

  /**
   * Constructor - initializes directory structure
   */
  constructor(baseDir: string, verbose = true) {
    this.baseDir = baseDir;
    this.verbose = verbose;

    // Create static directories
    this.staticDir = path.join(this.baseDir, "public", "static");
    this.contentDir = path.join(this.staticDir, "content");
    this.metaDir = path.join(this.staticDir, "content-meta");

    // Initialize directory structure
    this.initializeDirectories();
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
   * Process all content types
   */
  async processAllContent(): Promise<void> {
    if (this.verbose) console.log("Processing all content...");

    // Process each content type
    for (const contentType of CONTENT_TYPES) {
      await this.processContentType(contentType);
    }

    // Write metadata index files
    this.writeMetadataFiles();

    // Report any errors
    if (this.errors.length > 0) {
      console.error("\n🚨 Content preprocessing failed with errors:");
      this.errors.forEach((error) => console.error(`- ${error}`));
      throw new Error("Content preprocessing failed. See errors above.");
    }

    if (this.verbose) console.log("Content preprocessing complete!");
  }

  /**
   * Process a specific content type
   */
  private async processContentType(contentType: ContentType): Promise<void> {
    if (this.verbose) console.log(`Processing ${contentType} content...`);

    const srcDir = path.join(this.baseDir, "content", contentType);

    // Skip if source directory doesn't exist
    if (!fs.existsSync(srcDir)) {
      if (this.verbose) console.warn(`Source directory for ${contentType} not found: ${srcDir}`);
      return;
    }

    // Output directory for this content type
    const outputBase = path.join(this.contentDir, contentType);

    try {
      // Process this content type's directory
      await this.processContentDirectory(srcDir, contentType, outputBase);

      // Sort blog posts by date if applicable
      if (contentType === "blog") {
        this.sortBlogPosts();
      }
    } catch (error) {
      this.addError(
        `Error processing ${contentType} content: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process a content directory using glob to find all MDX files
   */
  private async processContentDirectory(
    srcDir: string,
    contentType: ContentType,
    outputBase: string
  ): Promise<void> {
    // Create output directory if it doesn't exist
    fs.mkdirSync(outputBase, { recursive: true });

    // Use glob to find all MDX files in the source directory
    const mdxFiles = await glob(path.join(srcDir, "**/*.mdx"));

    if (this.verbose) {
      console.log(`Found ${mdxFiles.length} MDX files for ${contentType}`);
    }

    // Process each MDX file
    for (const filePath of mdxFiles) {
      try {
        await this.processMdxFile(filePath, srcDir, contentType, outputBase);
      } catch (error) {
        this.addError(
          `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Create a consistent ContentPath object from file path components
   */
  private createContentPath(
    contentType: ContentType,
    relativePath: string,
    filename: string
  ): ContentPath {
    // Remove .mdx extension from relative path
    const cleanPath = relativePath.replace(/\.mdx$/, "");

    // The type-scoped path (e.g., "blog/my-post")
    const typePath = `${contentType}/${cleanPath}`;

    // The portion after content type
    const subpath = cleanPath;

    // The filename without extension (slug)
    const slug = filename;

    return {
      typePath,
      subpath,
      slug,
    };
  }

  /**
   * Validate that a filename is a valid slug
   */
  private validateSlug(filename: string, filePath: string): void {
    if (!ContentPreprocessor.VALID_SLUG_PATTERN.test(filename)) {
      throw new Error(
        `Invalid filename "${filename}" in ${filePath}. ` +
          `Filenames must be lowercase, contain only letters, numbers, and hyphens, ` +
          `and cannot have consecutive or leading/trailing hyphens.`
      );
    }
  }

  /**
   * Add an error to the collection for later reporting
   */
  private addError(message: string): void {
    this.errors.push(message);
    console.error(message);
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
    // Read and parse file
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(fileContent);

    // Get the relative path from the source directory
    const relativePath = path.relative(srcDir, filePath);

    // Get the file name without extension
    const filename = path.basename(filePath, ".mdx");

    // Validate the filename is a valid slug
    this.validateSlug(filename, filePath);

    // Create a consistent content path object
    const contentPath = this.createContentPath(contentType, relativePath, filename);

    // Create and validate metadata in one step
    const metadata = this.createAndValidateMetadata(
      contentType,
      frontmatter,
      contentPath,
      filePath
    );

    // Add to the appropriate metadata collection
    this.addToMetadataCollection(contentType, metadata);

    // Create content object that will be saved to JSON
    // Just store meta and the raw content (with frontmatter included)
    // MDX processing will happen at load time
    const contentObject = {
      meta: metadata,
      content: fileContent,
    };

    // Create output directory if needed
    const outputDir = path.dirname(path.join(outputBase, `${contentPath.subpath}.json`));
    fs.mkdirSync(outputDir, { recursive: true });

    // Write content file with metadata
    fs.writeFileSync(
      path.join(outputBase, `${contentPath.subpath}.json`),
      JSON.stringify(contentObject)
    );

    if (this.verbose) console.log(`Processed ${contentType} file: ${contentPath.subpath}`);
  }

  /**
   * Create and validate metadata for a content file
   */
  private createAndValidateMetadata(
    contentType: ContentType,
    frontmatter: Record<string, any>,
    contentPath: ContentPath,
    filePath: string
  ): ContentMeta {
    // Start with collecting missing fields
    const missingFields: string[] = [];

    // Check base required fields for all content types
    if (!frontmatter.title) missingFields.push("title");
    // TODO: Enable description checking
    // if (!frontmatter.description) missingFields.push('description');

    // Type-specific required fields and validation
    let metadata: Partial<ContentMeta> = {
      type: contentType,
      path: contentPath.typePath,
      slug: contentPath.slug,
    };

    switch (contentType) {
      case "blog":
        // Check required blog fields
        if (!frontmatter.date) missingFields.push("date");
        if (!frontmatter.author) missingFields.push("author");
        if (!frontmatter.readTime) missingFields.push("readTime");

        // Validate date format
        if (frontmatter.date && !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.date)) {
          throw new Error(`Invalid date format in ${filePath}. Date must be in YYYY-MM-DD format.`);
        }

        // Construct blog metadata
        metadata = {
          ...metadata,
          title: frontmatter.title,
          description: frontmatter.description,
          date: frontmatter.date,
          readTime: frontmatter.readTime,
          author: frontmatter.author,
          ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
        } as Partial<BlogMeta>;
        break;

      case "doc":
        // Extract product from path, assuming format: doc/product/...
        const pathParts = contentPath.subpath.split("/");
        const product = pathParts.length > 0 ? pathParts[0] : "";

        // Check product if not in path
        if (!product) missingFields.push("product");

        // Construct doc metadata
        metadata = {
          ...metadata,
          title: frontmatter.title,
          description: frontmatter.description,
          product,
          hasExtractableSnippets: frontmatter.hasExtractableSnippets || false,
        } as Partial<DocMeta>;
        break;

      case "policy":
        // Check required policy fields
        if (!frontmatter.lastUpdated) missingFields.push("lastUpdated");

        // Construct policy metadata
        metadata = {
          ...metadata,
          title: frontmatter.title,
          description: frontmatter.description,
          lastUpdated: frontmatter.lastUpdated,
        } as Partial<PolicyMeta>;
        break;

      default:
        // For other types, just use base fields
        metadata = {
          ...metadata,
          title: frontmatter.title,
          description: frontmatter.description,
        };
    }

    // Throw error if any required fields are missing
    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields in ${filePath}: ${missingFields.join(", ")}. ` +
          `These fields must be provided in the frontmatter.`
      );
    }

    return metadata as ContentMeta;
  }

  /**
   * Add metadata to the appropriate collection based on content type
   */
  private addToMetadataCollection(contentType: ContentType, metadata: ContentMeta): void {
    switch (contentType) {
      case "blog":
        this.blogMetadata.push(metadata as BlogMeta);
        break;
      case "doc":
        this.docMetadata.push(metadata as DocMeta);
        break;
      case "policy":
        this.policyMetadata.push(metadata as PolicyMeta);
        break;
      case "dev":
        this.devMetadata.push(metadata);
        break;
    }
  }

  /**
   * Sort blog posts by date (newest first)
   */
  private sortBlogPosts(): void {
    if (this.blogMetadata.length > 0) {
      this.blogMetadata.sort((a, b) => {
        return new Date(b.date || "").getTime() - new Date(a.date || "").getTime();
      });

      if (this.verbose) {
        console.log(`Sorted ${this.blogMetadata.length} blog posts by date`);
      }
    }
  }

  /**
   * Write metadata index files for each content type
   */
  private writeMetadataFiles(): void {
    // Write blog metadata
    if (this.blogMetadata.length > 0) {
      fs.writeFileSync(
        path.join(this.metaDir, "blog", "index.json"),
        JSON.stringify(this.blogMetadata)
      );
      if (this.verbose) {
        console.log(`Created metadata index for blog with ${this.blogMetadata.length} items`);
      }
    }

    // Write doc metadata
    if (this.docMetadata.length > 0) {
      fs.writeFileSync(
        path.join(this.metaDir, "doc", "index.json"),
        JSON.stringify(this.docMetadata)
      );
      if (this.verbose) {
        console.log(`Created metadata index for doc with ${this.docMetadata.length} items`);
      }
    }

    // Write policy metadata
    if (this.policyMetadata.length > 0) {
      fs.writeFileSync(
        path.join(this.metaDir, "policy", "index.json"),
        JSON.stringify(this.policyMetadata)
      );
      if (this.verbose) {
        console.log(`Created metadata index for policy with ${this.policyMetadata.length} items`);
      }
    }

    // Write dev metadata
    if (this.devMetadata.length > 0) {
      fs.writeFileSync(
        path.join(this.metaDir, "dev", "index.json"),
        JSON.stringify(this.devMetadata)
      );
      if (this.verbose) {
        console.log(`Created metadata index for dev with ${this.devMetadata.length} items`);
      }
    }
  }

  /**
   * Return the processed metadata by content type
   */
  getMetadataByType(): {
    blog: BlogMeta[];
    doc: DocMeta[];
    policy: PolicyMeta[];
    dev: ContentMeta[];
  } {
    return {
      blog: this.blogMetadata,
      doc: this.docMetadata,
      policy: this.policyMetadata,
      dev: this.devMetadata,
    };
  }
}

/**
 * Main preprocessing function that creates the ContentPreprocessor
 * and processes all content
 */
export async function preprocessContent(baseDir: string, verbose = true): Promise<void> {
  try {
    const preprocessor = new ContentPreprocessor(baseDir, verbose);
    await preprocessor.processAllContent();
  } catch (error) {
    console.error("Error during preprocessing:", error);
    throw error; // Let the caller handle the error
  }
}
