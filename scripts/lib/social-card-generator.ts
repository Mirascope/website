import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import { getProjectRoot } from "../../src/lib/router-utils";
import { routeToFilename } from "../../src/lib/utils";
import { coloredLog } from "./terminal";

/**
 * Options for configuring the social card generator
 */
interface SocialCardOptions {
  width: number;
  height: number;
  outputDir: string;
  verbose: boolean;
}

/**
 * Social Card Generator class that uses puppeteer to generate social card images
 * without the need for a local development server
 */
export class SocialCardGenerator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private templateHtml: string;
  private tempHtmlPath: string | null = null;

  constructor(private options: SocialCardOptions) {
    this.options = {
      width: options.width || 1200,
      height: options.height || 630,
      outputDir: options.outputDir || path.join(getProjectRoot(), "public", "social-cards"),
      verbose: options.verbose || false,
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Load the template HTML
    this.templateHtml = this.loadAndModifyTemplate();
  }

  /**
   * Load the HTML template and modify it to use inline assets
   */
  private loadAndModifyTemplate(): string {
    const projectRoot = getProjectRoot();
    const templatePath = path.join(projectRoot, "public", "dev", "social-card.html");

    // Read the template file
    let templateHtml = fs.readFileSync(templatePath, "utf-8");

    // Process font
    const fontPath = path.join(
      projectRoot,
      "public",
      "fonts",
      "Williams-Handwriting-Regular-v1.ttf"
    );
    const fontData = fs.readFileSync(fontPath);
    const fontBase64 = fontData.toString("base64");

    // Replace font URL with inline data URL
    templateHtml = templateHtml.replace(
      /url\("\/fonts\/Williams-Handwriting-Regular-v1.ttf"\) format\("truetype"\)/g,
      `url(data:font/ttf;base64,${fontBase64}) format("truetype")`
    );

    // Find and process all image references
    const imageRegex = /url\("\/([^"]+\.(png|jpg|svg))"\)|src="\/([^"]+\.(png|jpg|svg))"/g;
    let match;
    const processedPaths = new Set();

    while ((match = imageRegex.exec(templateHtml)) !== null) {
      const imagePath = match[1] || match[3];

      // Skip if we've already processed this path
      if (processedPaths.has(imagePath)) {
        continue;
      }

      processedPaths.add(imagePath);

      // Read the image file
      const fullImagePath = path.join(projectRoot, "public", imagePath);

      if (fs.existsSync(fullImagePath)) {
        const imageData = fs.readFileSync(fullImagePath);
        const imageBase64 = imageData.toString("base64");
        const extension = path.extname(fullImagePath).substring(1);
        let mimeType = `image/${extension}`;

        // Special handling for SVG
        if (extension === "svg") {
          mimeType = "image/svg+xml";
        }

        // Replace all occurrences of this image with data URL
        const imgDataUrl = `data:${mimeType};base64,${imageBase64}`;

        templateHtml = templateHtml.replace(
          new RegExp(`url\\("/+${imagePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\)`, "g"),
          `url("${imgDataUrl}")`
        );

        templateHtml = templateHtml.replace(
          new RegExp(`src="/+${imagePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g"),
          `src="${imgDataUrl}"`
        );
      }
    }

    return templateHtml;
  }

  /**
   * Initialize the puppeteer browser and page
   */
  async initialize(): Promise<void> {
    if (this.options.verbose) {
      coloredLog("Initializing puppeteer browser...", "cyan");
    }

    // Launch browser
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();

    // Configure viewport
    await this.page.setViewport({
      width: this.options.width,
      height: this.options.height,
      deviceScaleFactor: 1,
    });

    // Write template to temporary file
    const tempDir = fs.mkdtempSync(
      path.join(path.resolve(process.env.TMPDIR || "/tmp"), "social-card-")
    );
    this.tempHtmlPath = path.join(tempDir, "social-card-template.html");
    fs.writeFileSync(this.tempHtmlPath, this.templateHtml);

    // Load template into page
    await this.page.goto(`file://${this.tempHtmlPath}`, { waitUntil: "networkidle0" });

    // Check if updateSocialCard function exists
    const hasUpdateFunction = await this.page.evaluate(() => {
      return typeof window.updateSocialCard === "function";
    });

    if (!hasUpdateFunction) {
      throw new Error("Template is missing updateSocialCard function");
    }

    if (this.options.verbose) {
      coloredLog("Puppeteer browser initialized", "green");
    }
  }

  /**
   * Generate a social card image for a single route
   */
  async generateSingleImage(route: string, title: string): Promise<string> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    // Create a safe filename
    const filename = routeToFilename(route);
    const outputPath = path.join(this.options.outputDir, `${filename}.webp`);

    // Create directory if it doesn't exist
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Process the title - Strip the title suffix (everything after and including " |")
    let processedTitle = title;
    const pipeIndex = title.lastIndexOf(" |");
    if (pipeIndex !== -1) {
      processedTitle = title.substring(0, pipeIndex);
    }

    // Update the social card with the provided title
    await this.page.evaluate((title) => {
      window.updateSocialCard!(title);
    }, processedTitle);

    // Brief delay to ensure rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Take screenshot with WebP compression
    await this.page.screenshot({
      path: outputPath,
      type: "webp",
      quality: 80,
      clip: {
        x: 0,
        y: 0,
        width: this.options.width,
        height: this.options.height,
      },
    });

    return outputPath;
  }

  /**
   * Generate all social card images from metadata
   */
  async generateAll(metadata: { route: string; title: string }[]): Promise<void> {
    if (metadata.length === 0) {
      if (this.options.verbose) {
        coloredLog("No routes to process for image generation", "yellow");
      }
      return;
    }

    if (this.options.verbose) {
      coloredLog(`Generating images for ${metadata.length} routes`, "blue");
    }

    // Initialize if not already done
    if (!this.browser || !this.page) {
      await this.initialize();
    }

    let successCount = 0;

    // Process each route
    for (let i = 0; i < metadata.length; i++) {
      const { route, title } = metadata[i];

      if (this.options.verbose) {
        coloredLog(`[${i + 1}/${metadata.length}] Processing: ${route}`, "cyan");
      }

      if (!title) {
        if (this.options.verbose) {
          coloredLog(`⚠ Skipping route with missing title: ${route}`, "yellow");
        }
        continue;
      }

      try {
        const imagePath = await this.generateSingleImage(route, title);
        successCount++;

        if (this.options.verbose) {
          coloredLog(`✓ Generated image for: ${route} at ${imagePath}`, "green");
        }
      } catch (error) {
        console.error(`✗ Failed to generate image for ${route}:`);
        console.error(error);
      }
    }

    if (this.options.verbose) {
      coloredLog(
        `Completed image generation. Success: ${successCount}/${metadata.length}`,
        "green"
      );
    }
  }

  /**
   * Close the browser and clean up temporary files
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    // Clean up temporary file
    if (this.tempHtmlPath && fs.existsSync(this.tempHtmlPath)) {
      fs.unlinkSync(this.tempHtmlPath);

      // Try to remove the temp directory
      const tempDir = path.dirname(this.tempHtmlPath);
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir, { recursive: true });
      }
    }
  }
}

/**
 * Generate OG images for multiple routes
 * Simplified wrapper for backward compatibility
 */
export async function generateOgImages(
  metadata: { route: string; title: string }[],
  verbose = true
): Promise<void> {
  if (metadata.length === 0) {
    if (verbose) {
      coloredLog("No routes to process for image generation", "yellow");
    }
    return;
  }

  // Ensure output directory exists
  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, "public", "social-cards");

  // Create generator
  const generator = new SocialCardGenerator({
    width: 1200,
    height: 630,
    outputDir,
    verbose,
  });

  try {
    // Generate all images
    await generator.generateAll(metadata);
  } catch (error) {
    console.error(`Error during image generation: ${error}`);
  } finally {
    // Clean up
    await generator.close();
  }
}
