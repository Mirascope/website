import path from "path";
import { glob } from "glob";
import { createHash } from "crypto";
import { readFile, access } from "fs/promises";
import { constants } from "fs";
import yaml from "js-yaml";
import { getCassettePath } from "../src/lib/content/vcr-cassettes";

interface ValidationError {
  type: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  hasCassette: boolean;
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a YAML file is a VCR.py cassette by verifying it starts with "interactions:"
 */
async function isVcrCassette(yamlPath: string): Promise<boolean> {
  try {
    const content = await readFile(yamlPath, "utf-8");
    // Check if the file starts with "interactions:" (allowing for whitespace)
    return content.trimStart().startsWith("interactions:");
  } catch (error) {
    return false;
  }
}

/**
 * Validate a single cassette file by processing a Python file path
 */
async function validateCassetteFile(
  pythonPath: string,
  failOnMissing: boolean = false
): Promise<ValidationResult> {
  try {
    const projectRoot = process.cwd();

    // Convert Python file path to relative path from project root
    const relativePath = path.relative(projectRoot, pythonPath);

    // Construct cassette path using getCassettePath
    const cassettePath = getCassettePath(relativePath);
    const yamlPath = path.join(projectRoot, cassettePath);

    // Check if cassette file exists
    const exists = await fileExists(yamlPath);
    if (!exists) {
      if (failOnMissing) {
        return {
          isValid: false,
          errors: [
            {
              type: "missing-cassette",
              message: `Cassette file does not exist: ${yamlPath}`,
            },
          ],
          hasCassette: false,
        };
      }
      // If not failing on missing, skip validation (return valid)
      return { isValid: true, errors: [], hasCassette: false };
    }

    // Check if it's a VCR.py cassette
    const isVcr = await isVcrCassette(yamlPath);
    if (!isVcr) {
      return {
        isValid: false,
        errors: [
          {
            type: "not-vcr-cassette",
            message: `Not a VCR.py cassette (missing 'interactions:'): ${yamlPath}`,
          },
        ],
        hasCassette: true,
      };
    }

    // Read and parse YAML cassette to get source checksum
    let yamlContent: string;
    let cassetteData: any;
    try {
      yamlContent = await readFile(yamlPath, "utf-8");
      cassetteData = yaml.load(yamlContent);
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: "yaml-read-error",
            message: `Failed to read or parse YAML file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        hasCassette: true,
      };
    }

    // Check if source_sha256 property exists in YAML
    const storedHash = cassetteData?.source_sha256;
    if (!storedHash || typeof storedHash !== "string") {
      return {
        isValid: false,
        errors: [
          {
            type: "missing-checksum",
            message: `Missing source_sha256 property in YAML cassette: ${yamlPath}`,
          },
        ],
        hasCassette: true,
      };
    }

    // Read Python file and calculate SHA256
    let pythonContent: string;
    try {
      pythonContent = await readFile(pythonPath, "utf-8");
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: "python-file-error",
            message: `Failed to read Python file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        hasCassette: true,
      };
    }

    const calculatedHash = createHash("sha256").update(pythonContent).digest("hex");

    // Compare hashes
    if (calculatedHash !== storedHash) {
      return {
        isValid: false,
        errors: [
          {
            type: "checksum-mismatch",
            message: `Recorded checksum mismatch: expected ${storedHash}, got ${calculatedHash}`,
          },
        ],
        hasCassette: true,
      };
    }

    return { isValid: true, errors: [], hasCassette: true };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          type: "validation-error",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
      hasCassette: false,
    };
  }
}

/**
 * Validate multiple cassette files from a glob pattern
 */
async function validateCassetteFiles(
  globPattern: string,
  failOnMissing: boolean = false
): Promise<{ file: string; result: ValidationResult }[]> {
  const projectRoot = process.cwd();
  const pattern = path.isAbsolute(globPattern) ? globPattern : path.join(projectRoot, globPattern);

  const pyfiles = await glob(pattern, { nodir: true });

  const results: { file: string; result: ValidationResult }[] = [];

  for (const pyfile of pyfiles) {
    const result = await validateCassetteFile(pyfile, failOnMissing);
    results.push({ file: pyfile, result });
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI flags
  const failOnMissing = args.includes("--fail-on-missing") || args.includes("--strict");

  // Get target file path (first non-flag argument, optional)
  const targetFile = args.find((arg) => !arg.startsWith("--"));
  const projectRoot = process.cwd();

  if (targetFile) {
    // Single file validation
    // Resolve to absolute path if relative
    const pythonPath = path.isAbsolute(targetFile)
      ? targetFile
      : path.join(projectRoot, targetFile);

    // Check if file exists
    if (!(await fileExists(pythonPath))) {
      console.error(`❌ Error: Python file does not exist: ${pythonPath}`);
      process.exit(1);
    }

    // Check if it's a Python file - if not, fall back to default glob pattern
    if (pythonPath.endsWith(".py")) {
      // It's a Python file, validate it
      console.log(`Validating cassette for ${path.relative(projectRoot, pythonPath)}...`);
      if (failOnMissing) {
        console.log("⚠️  Missing cassettes will be treated as validation errors");
      }

      const result = await validateCassetteFile(pythonPath, failOnMissing);

      if (result.isValid) {
        console.log("\n🎉 Cassette validation passed!");
      } else {
        console.error(
          `\n❌ Cassette validation failed for ${path.relative(projectRoot, pythonPath)}:\n`
        );

        for (const err of result.errors) {
          console.error(`  → ${err.message}`);
        }

        console.error("\n❌ Cassette validation failed. Please fix the errors above.");
        process.exit(1);
      }
      return; // Exit early after single file validation
    }
    // If not a Python file, fall through to default glob pattern validation
  }

  // Default glob pattern validation (runs if no targetFile or targetFile is not a .py file)
  const defaultGlobPattern = "content/docs/mirascope/v2/examples/**/*.py";

  console.log(`Validating cassette files matching ${defaultGlobPattern}...`);
  if (failOnMissing) {
    console.log("⚠️  Missing cassettes will be treated as validation errors");
  }

  const results = await validateCassetteFiles(defaultGlobPattern, failOnMissing);
  const errors = results.filter((r) => !r.result.isValid);

  // Count how many files actually had cassette files
  const filesWithCassettes = results.filter((r) => r.result.hasCassette).length;

  for (const { result } of results) {
    if (result.isValid) {
      process.stdout.write(".");
    } else {
      process.stdout.write("X");
    }
  }

  console.log(
    `\n\nChecked ${results.length} python files (${filesWithCassettes} had cassette files)`
  );

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} cassette files with errors:\n`);

    for (const { file, result } of errors) {
      const relativePath = path.relative(projectRoot, file);
      console.error(`\n❌ ${relativePath}`);

      for (const err of result.errors) {
        console.error(`  → ${err.message}`);
      }

      console.error("\n---");
    }

    console.error("\n❌ Cassette validation failed. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log(
      "\n🎉 Available cassette files checksums are matching their Python files correctly!"
    );
  }
}

main().catch((error) => {
  console.error("Validation failed with error:", error);
  process.exit(1);
});
