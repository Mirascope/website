#!/usr/bin/env bun

import { createHash } from "crypto";
import { existsSync, rmSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve, dirname, relative } from "path";
import { spawnSync } from "child_process";
import { glob } from "glob";
import yaml from "js-yaml";
import { transformPythonWithVcrDecorator, getCassettePath } from "../src/lib/content/vcr-cassettes";

interface Config {
  pattern: string;
  dryRun: boolean;
}

interface ProcessResult {
  file: string;
  success: boolean;
  error?: string;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Config {
  const args = process.argv.slice(2);
  let pattern = "content/docs/mirascope/v2/examples/**/*.py";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--pattern" || args[i] === "-p") && i + 1 < args.length) {
      pattern = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { pattern, dryRun };
}

/**
 * Run a command and return the result
 */
function runCommand(
  command: string,
  args: string[],
  cwd?: string
): { success: boolean; error?: string; stdout?: string; stderr?: string } {
  const result = spawnSync(command, args, {
    cwd: cwd || process.cwd(),
    stdio: "pipe",
    shell: false,
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  const stdout = result.stdout?.toString() || "";
  const stderr = result.stderr?.toString() || "";

  if (result.status !== 0) {
    return {
      success: false,
      error: stderr || `Command failed with exit code ${result.status}`,
      stdout,
      stderr,
    };
  }

  return { success: true, stdout, stderr };
}

/**
 * Sanitize YAML cassette by removing sensitive authentication tokens
 * and optionally add source file checksum
 */
function sanitizeYamlCassette(yamlContent: string, sourceSha256?: string): string {
  try {
    const data = yaml.load(yamlContent) as any;

    if (!data || !data.interactions || !Array.isArray(data.interactions)) {
      return yamlContent;
    }

    // Sensitive header keys to sanitize
    const sensitiveKeys = [
      "x-api-key",
      "authorization",
      "x-auth-token",
      "api-key",
      "x-anthropic-api-key",
      "x-openai-api-key",
    ];

    // Process each interaction
    data.interactions.forEach((interaction: any) => {
      if (interaction.request?.headers) {
        sensitiveKeys.forEach((key) => {
          const lowerKey = key.toLowerCase();
          Object.keys(interaction.request.headers).forEach((headerKey) => {
            if (headerKey.toLowerCase() === lowerKey) {
              interaction.request.headers[headerKey] = ["cached-http-with-invalid-key"];
            }
          });
        });
      }
    });

    // Add source file checksum if provided
    if (sourceSha256) {
      data.source_sha256 = sourceSha256;
    }

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
  } catch (error) {
    console.warn(
      `Warning: Failed to parse YAML, returning original content: ${error instanceof Error ? error.message : String(error)}`
    );
    return yamlContent;
  }
}

/**
 * Set up the virtual environment using uv sync in cachedHTTP directory
 */
async function setupVenv(
  cachedHTTPDir: string,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  if (dryRun) {
    console.log(`[DRY RUN] Would sync venv in: ${cachedHTTPDir}`);
    return { success: true };
  }

  // Ensure cachedHTTP directory exists
  if (!existsSync(cachedHTTPDir)) {
    return { success: false, error: `cachedHTTP directory not found: ${cachedHTTPDir}` };
  }

  // Use uv sync to create venv and install dependencies from pyproject.toml
  console.log("Setting up virtual environment with uv sync...");
  const syncResult = runCommand("uv", ["sync"], cachedHTTPDir);
  if (!syncResult.success) {
    return { success: false, error: syncResult.error || "Failed to sync venv" };
  }

  return { success: true };
}

/**
 * Find Python files matching the pattern
 */
async function findPythonFiles(pattern: string): Promise<string[]> {
  const files = await glob(pattern, {
    cwd: process.cwd(),
    absolute: true,
  });
  return files.filter((file) => file.endsWith(".py"));
}

/**
 * Process a single Python file
 */
async function processFile(
  pythonFile: string,
  workDir: string,
  cachedHTTPDir: string,
  projectRoot: string,
  dryRun: boolean
): Promise<ProcessResult> {
  try {
    // Calculate relative path from project root
    const relativePath = relative(projectRoot, pythonFile);
    const recordingPath = resolve(workDir, relativePath);
    const recordingDirPath = dirname(recordingPath);

    // Calculate flat destination cassette path based of original file path
    const destinationCassettePath = getCassettePath(relativePath);

    // Read original file
    const originalContent = await readFile(pythonFile, "utf-8");

    // Calculate YAML path - Use absolute path so VCR.py creates cassettes in the right place
    // regardless of current working directory
    const yamlPath = recordingPath + ".yaml";

    // Transform content
    const transformedContent = transformPythonWithVcrDecorator(originalContent, yamlPath);

    if (dryRun) {
      console.log(`[DRY RUN] Would write: ${destinationCassettePath}`);
      return { file: pythonFile, success: true };
    }

    // Create recording directory structure
    await mkdir(recordingDirPath, { recursive: true });

    // Write transformed file to recording
    await writeFile(recordingPath, transformedContent, "utf-8");

    // Execute Python file using uv run (which uses the venv from pyproject.toml)
    const { success, error, stdout, stderr } = runCommand(
      "uv",
      ["run", "python", recordingPath],
      cachedHTTPDir
    );

    if (!success) {
      const errorMsg = error || "Unknown error";
      const output = stdout ? `\nStdout: ${stdout}` : "";
      const errOutput = stderr ? `\nStderr: ${stderr}` : "";
      return { file: pythonFile, success: false, error: `${errorMsg}${output}${errOutput}` };
    }

    // Debug: show what was output
    if (stdout) {
      console.log(`  Python stdout: ${stdout.trim()}`);
    }
    if (stderr) {
      console.log(`  Python stderr: ${stderr.trim()}`);
    }

    // Calculate the sha256 checksum of the original content
    const originalContentSha256 = createHash("sha256").update(originalContent).digest("hex");

    // Look for generated YAML cassette
    // VCR.py creates cassettes relative to the Python file's location
    const cassettePath = recordingPath + ".yaml";

    if (!existsSync(cassettePath)) {
      // Debug: show what decorator path was used
      console.log(`  Original content sha256: ${originalContentSha256}`);
      console.log(`  Decorator path: ${yamlPath}`);
      console.log(`  Expected cassette at: ${cassettePath}`);
      console.log(`  Recording path: ${recordingPath}`);
      console.log(`  Recording dir path: ${recordingDirPath}`);

      return {
        file: pythonFile,
        success: false,
        error: `Cassette file not generated. Expected at: ${cassettePath}`,
      };
    }

    // Read and sanitize cassette, adding source checksum to YAML
    const cassetteContent = await readFile(cassettePath, "utf-8");
    const sanitizedContent = sanitizeYamlCassette(cassetteContent, originalContentSha256);

    // Copy sanitized cassette back to original location
    const originalCassetteDir = dirname(destinationCassettePath);
    await mkdir(originalCassetteDir, { recursive: true });
    await writeFile(destinationCassettePath, sanitizedContent, "utf-8");

    return { file: pythonFile, success: true };
  } catch (error) {
    return {
      file: pythonFile,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const config = parseArgs();
  const projectRoot = process.cwd();
  const cachedHTTPDir = resolve(projectRoot, "scripts", "cachedHTTP");
  const workDir = resolve(cachedHTTPDir, ".work");

  console.log("VCR Cassette Recording Script");
  console.log(`Pattern: ${config.pattern}`);
  console.log(`Using cachedHTTP directory: ${cachedHTTPDir}`);
  console.log(`Work directory: ${workDir}`);
  console.log(`Dry run: ${config.dryRun ? "yes" : "no"}`);
  console.log("");

  // Find Python files
  console.log("Discovering Python files...");
  const pythonFiles = await findPythonFiles(config.pattern);
  console.log(`Found ${pythonFiles.length} Python file(s)`);
  console.log("");

  if (pythonFiles.length === 0) {
    console.log("No Python files found matching the pattern.");
    return;
  }

  // Set up virtual environment using uv sync
  const venvResult = await setupVenv(cachedHTTPDir, config.dryRun);
  if (!venvResult.success) {
    console.error(`Failed to set up virtual environment: ${venvResult.error}`);
    process.exit(1);
  }
  console.log("");

  // Clean up work directory if it exists
  if (existsSync(workDir)) {
    if (!config.dryRun) {
      rmSync(workDir, { recursive: true, force: true });
    }
    console.log(`Cleaned work directory: ${workDir}`);
  }

  // Process each file
  const results: ProcessResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < pythonFiles.length; i++) {
    const file = pythonFiles[i];
    const relativePath = relative(projectRoot, file);
    console.log(`[${i + 1}/${pythonFiles.length}] Processing: ${relativePath}`);

    const result = await processFile(file, workDir, cachedHTTPDir, projectRoot, config.dryRun);
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`  ✓ Success`);
    } else {
      failureCount++;
      console.log(`  ✗ Failed: ${result.error || "Unknown error"}`);
    }
  }

  // Clean up work directory
  if (!config.dryRun && existsSync(workDir)) {
    rmSync(workDir, { recursive: true, force: true });
    console.log(`\nCleaned up work directory`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Summary:");
  const totalCount = pythonFiles.length;
  console.log(`  Total files: ${totalCount}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failureCount}`);
  console.log(`  Skipped: ${totalCount - successCount - failureCount}`);

  if (failureCount > 0) {
    console.log("\nFailed files:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${relative(projectRoot, r.file)}: ${r.error}`);
      });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
