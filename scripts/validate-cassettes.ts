import path from "path";
import { glob } from "glob";
import { createHash } from "crypto";
import { readFile, access } from "fs/promises";
import { constants } from "fs";

interface ValidationError {
  type: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
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
 * Validate a single cassette file
 */
async function validateCassetteFile(yamlPath: string): Promise<ValidationResult> {
  try {
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
      };
    }

    // Derive Python file path by removing .yaml extension
    const pythonPath = yamlPath.replace(/\.yaml$/, "");
    const checksumPath = pythonPath + ".sha256.txt";

    // Check if checksum file exists
    try {
      await access(checksumPath, constants.F_OK);
    } catch {
      return {
        isValid: false,
        errors: [
          {
            type: "missing-checksum",
            message: `Missing checksum file: ${checksumPath}`,
          },
        ],
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
      };
    }

    const calculatedHash = createHash("sha256").update(pythonContent).digest("hex");

    // Read checksum file
    let storedHash: string;
    try {
      const checksumContent = await readFile(checksumPath, "utf-8");
      storedHash = checksumContent.trim();
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: "checksum-read-error",
            message: `Failed to read checksum file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

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
      };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          type: "validation-error",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

/**
 * Validate all cassette files in a directory
 */
async function validateCassetteDirectory(
  dirPath: string
): Promise<{ file: string; result: ValidationResult }[]> {
  const pattern = path.join(dirPath, "**/*.yaml");
  const files = await glob(pattern, { nodir: true });

  const results: { file: string; result: ValidationResult }[] = [];

  for (const file of files) {
    const result = await validateCassetteFile(file);
    results.push({ file, result });
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || "content/docs/mirascope/v2/examples";

  console.log(`Validating cassette files in ${targetPath}...`);

  const results = await validateCassetteDirectory(targetPath);
  const errors = results.filter((r) => !r.result.isValid);

  for (const { result } of results) {
    if (result.isValid) {
      process.stdout.write(".");
    } else {
      process.stdout.write("X");
    }
  }

  console.log(`\n\nChecked ${results.length} files`);

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} cassette files with errors:\n`);

    for (const { file, result } of errors) {
      const relativePath = path.relative(process.cwd(), file);
      console.error(`\n❌ ${relativePath}`);

      for (const err of result.errors) {
        console.error(`  → ${err.message}`);
      }

      console.error("\n---");
    }

    console.error("\n❌ Cassette validation failed. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log("\n🎉 All cassette files are valid!");
  }
}

main().catch((error) => {
  console.error("Validation failed with error:", error);
  process.exit(1);
});
