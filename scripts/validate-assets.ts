#!/usr/bin/env bun
/**
 * Script to validate internal links and images in the prerendered HTML
 * This ensures all internal links point to valid routes and all images to valid files
 */
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { getAllRoutes } from "../src/lib/router-utils";
import { glob } from "glob";
import { colorize, printHeader, icons, coloredLog } from "./lib/terminal";

interface ValidationResult {
  valid: boolean;
  brokenLinks: { page: string; link: string; text: string }[];
  brokenImages: { page: string; src: string; alt: string }[];
}

async function validateLinksAndImages(
  distDir: string,
  verbose: boolean = false
): Promise<ValidationResult> {
  printHeader("Validating Internal Links and Images");

  // Get all valid routes
  const validRoutes = await getAllRoutes(true);
  if (verbose) {
    console.log(`Found ${validRoutes.length} valid routes in the site`);
  }

  // Add route normalizations (with and without trailing slash)
  const validRoutesSet = new Set<string>();
  validRoutes.forEach((route) => {
    validRoutesSet.add(route);
    validRoutesSet.add(route + "/");
    if (route !== "/" && route.endsWith("/")) {
      validRoutesSet.add(route.slice(0, -1));
    }
  });

  // Find all HTML files in the dist directory
  const htmlFiles = await glob(`${distDir}/**/index.html`);
  console.log(`${icons.info} Found ${htmlFiles.length} HTML files to check`);

  // Gather all assets in the dist directory
  const assetFiles = await glob(`${distDir}/assets/**/*.*`);
  const validAssetSet = new Set<string>();

  // Normalize asset paths for validation
  assetFiles.forEach((assetPath) => {
    // Convert to web path format (relative to dist directory)
    const webPath = "/" + path.relative(distDir, assetPath);
    validAssetSet.add(webPath);

    // Add WebP variants to valid assets set since they'll be generated during build
    if (![".svg", ".gif", ".webp"].includes(path.extname(assetPath).toLowerCase())) {
      const basePath = webPath.substring(0, webPath.lastIndexOf("."));
      validAssetSet.add(`${basePath}.webp`);
      validAssetSet.add(`${basePath}-medium.webp`);
      validAssetSet.add(`${basePath}-small.webp`);
    }
  });

  if (verbose) {
    console.log(`Found ${validAssetSet.size} valid assets in the site`);
  }

  const brokenLinks: { page: string; link: string; text: string }[] = [];
  const brokenImages: { page: string; src: string; alt: string }[] = [];
  let totalLinks = 0;
  let totalImages = 0;

  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, "utf-8");
    const dom = new JSDOM(content);
    const links = dom.window.document.querySelectorAll("a[href^='/']");
    const images = dom.window.document.querySelectorAll("img[src^='/']");

    // Get the relative path for reporting
    const relativePath = path.relative(distDir, htmlFile);
    // Convert dist/some/path/index.html to /some/path
    const currentPage = "/" + relativePath.replace(/\/index\.html$/, "");

    if (verbose) {
      console.log(`Checking ${links.length} links and ${images.length} images in ${relativePath}`);
    }

    // Check each internal link
    links.forEach((link: Element) => {
      totalLinks++;
      const href = link.getAttribute("href") as string;

      // Skip anchor links to the same page
      if (href.startsWith("#")) {
        return;
      }

      // Parse the URL to handle query parameters and anchors
      let urlPath = href;
      try {
        // Handle absolute paths with host
        if (href.startsWith("/")) {
          urlPath = href.split("#")[0].split("?")[0];
        } else {
          const url = new URL(href, "https://example.com");
          urlPath = url.pathname;
        }
      } catch (e) {
        // If URL parsing fails, use the original href
        urlPath = href;
      }

      // Check if the link points to a valid route
      if (!validRoutesSet.has(urlPath)) {
        brokenLinks.push({
          page: currentPage,
          link: href,
          text: link.textContent || "[No text]",
        });
      }
    });

    // Check each internal image
    images.forEach((image: Element) => {
      totalImages++;
      const src = image.getAttribute("src") as string;
      const alt = image.getAttribute("alt") || "[No alt text]";

      // Skip data URLs
      if (src.startsWith("data:")) {
        return;
      }

      // Check if the image source exists in the asset files
      // ResponsiveImage component uses WebP versions, but we also need to check original sources
      const isValidImage = validAssetSet.has(src);

      if (!isValidImage) {
        brokenImages.push({
          page: currentPage,
          src,
          alt,
        });
      }
    });
  }

  // Output results for links
  let isValid = true;

  if (brokenLinks.length > 0) {
    isValid = false;
    coloredLog(`\n${icons.error} Found ${brokenLinks.length} broken internal links:`, "red");

    // Group by page for easier readability
    const byPage = brokenLinks.reduce(
      (acc, { page, link, text }) => {
        if (!acc[page]) acc[page] = [];
        acc[page].push({ link, text });
        return acc;
      },
      {} as Record<string, { link: string; text: string }[]>
    );

    Object.entries(byPage).forEach(([page, links]) => {
      console.log(`\n${colorize(`Page: ${page}`, "yellow")}`);
      links.forEach(({ link, text }) => {
        console.log(
          `  ${icons.arrow} ${colorize(link, "red")} (${text.substring(0, 30)}${text.length > 30 ? "..." : ""})`
        );
      });
    });
  } else {
    coloredLog(`\n${icons.success} All ${totalLinks} internal links are valid!`, "green");
  }

  // Output results for images
  if (brokenImages.length > 0) {
    isValid = false;
    coloredLog(`\n${icons.error} Found ${brokenImages.length} broken internal images:`, "red");

    // Group by page for easier readability
    const byPage = brokenImages.reduce(
      (acc, { page, src, alt }) => {
        if (!acc[page]) acc[page] = [];
        acc[page].push({ src, alt });
        return acc;
      },
      {} as Record<string, { src: string; alt: string }[]>
    );

    Object.entries(byPage).forEach(([page, images]) => {
      console.log(`\n${colorize(`Page: ${page}`, "yellow")}`);
      images.forEach(({ src, alt }) => {
        console.log(
          `  ${icons.arrow} ${colorize(src, "red")} (${alt.substring(0, 30)}${alt.length > 30 ? "..." : ""})`
        );
      });
    });
  } else {
    coloredLog(`\n${icons.success} All ${totalImages} internal images are valid!`, "green");
  }

  return {
    valid: isValid,
    brokenLinks,
    brokenImages,
  };
}

// When run directly
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const distDir = path.join(process.cwd(), "dist");

  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    coloredLog(`${icons.error} Dist directory not found! Run \`bun run build\` first.`, "red");
    process.exit(1);
  }

  try {
    const result = await validateLinksAndImages(distDir, verbose);
    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    coloredLog(`${icons.error} Error validating links and images:`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run the script if invoked directly
if (import.meta.path === Bun.main) {
  await main();
}

// Export for use in other scripts
export { validateLinksAndImages };
