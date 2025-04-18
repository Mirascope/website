#!/usr/bin/env bun
/**
 * Production SSG script that prerenders routes using the production Vite build
 * This script is meant to be run after `bun run build`
 */
import path from "path";
import fs from "fs";
import os from "os";
import { prerenderPage } from "./lib/prerender";
import { getAllRoutes } from "../src/lib/router-utils";

async function main() {
  // Get arguments
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");

  // Define paths
  const distDir = path.join(process.cwd(), "dist");
  const prodTemplatePath = path.join(distDir, "index.html");

  // Check if the production build exists
  if (!fs.existsSync(prodTemplatePath)) {
    console.error("❌ Production build not found! Run `bun run build` first.");
    process.exit(1);
  }

  // Read the production template
  const prodTemplate = fs.readFileSync(prodTemplatePath, "utf-8");

  // Make a temporary copy of the production template to index.html
  // This is needed because our prerender.ts uses the root index.html as template
  const rootTemplatePath = path.join(process.cwd(), "index.html");
  const originalTemplate = fs.existsSync(rootTemplatePath)
    ? fs.readFileSync(rootTemplatePath, "utf-8")
    : null;

  // Create a unique temp file path for backup in the OS temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssg-prerender-"));
  const backupPath = path.join(tempDir, "index.html.backup");

  // Back up the original template if it exists
  if (originalTemplate) {
    fs.writeFileSync(backupPath, originalTemplate);
  }

  try {
    // Write the production template to root index.html temporarily
    fs.writeFileSync(rootTemplatePath, prodTemplate);

    // Get all routes to prerender
    const routes = await getAllRoutes();
    console.log(`\n🔄 Pre-rendering ${routes.length} routes to production-ready HTML...`);

    // Prerender each route directly to dist
    let successCount = 0;
    let failureCount = 0;

    for (const route of routes) {
      try {
        if (verbose) console.log(`Pre-rendering ${route}...`);
        await prerenderPage(route, distDir, false);
        successCount++;
        process.stdout.write(".");
      } catch (error) {
        failureCount++;
        process.stdout.write("✗");
        if (verbose) console.error(`\nError pre-rendering ${route}:`, error);
      }
    }

    console.log(`\n\n✅ Pre-rendering complete!`);
    console.log(`   - Successfully pre-rendered: ${successCount} routes`);
    if (failureCount > 0) {
      console.log(`   - Failed to pre-render: ${failureCount} routes`);
    }
  } finally {
    // Restore the original template if it existed
    if (originalTemplate) {
      fs.writeFileSync(rootTemplatePath, originalTemplate);
    } else {
      // Remove the temporary template
      fs.unlinkSync(rootTemplatePath);
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Could not clean up temporary directory:", tempDir);
    }
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Pre-rendering failed:", error);
  process.exit(1);
});
