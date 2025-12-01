#!/usr/bin/env bun

/**
 * Script to run cassette validation on the entire directory regardless of what files were changed
 * This ensures we validate all cassette files, not just modified ones
 */

import { execSync } from "child_process";

// Run the cassette validation on the entire directory, ignoring any specific paths
console.log("Running cassette validation on the entire directory...");

try {
  // Execute the validation command - this validates all files in the directory
  execSync("bun run lint:cassettes", { stdio: "inherit" });
  console.log("Cassette validation passed");
} catch (error) {
  console.error("Cassette validation failed!");
  process.exit(1);
}
