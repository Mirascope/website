import fs from "fs";
import path from "path";
import { processMDXContent, type ContentType } from "@/src/lib/content";
import { preprocessMdx } from "@/src/lib/content/mdx-preprocessing";

// Define the validation result type
interface ValidationError {
  type: string;
  message: string;
  line?: number;
  column?: number;
  context?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Define content locations
interface ContentLocation {
  dir: string;
  type: ContentType;
  emoji: string;
  label: string;
  recursive: boolean;
  ignoredChildren?: string[];
}

// Configuration for each content type
const contentLocations: ContentLocation[] = [
  {
    dir: "content/blog",
    type: "blog",
    emoji: "📝",
    label: "blog posts",
    recursive: false,
  },
  {
    dir: "content/docs",
    type: "docs",
    emoji: "📚",
    label: "documentation files",
    recursive: true,
    ignoredChildren: ["mirascope/v2"],
  },
  {
    dir: "content/policy",
    type: "policy",
    emoji: "📜",
    label: "policy documents",
    recursive: true,
  },
  // Note: content/llms is excluded as it contains template files with {{include}} directives
  // that are not valid MDX syntax
];

/**
 * Validate MDX content with the MDX processor
 */
async function validateMDXSyntax(
  content: string,
  path: string,
  contentType: ContentType
): Promise<ValidationResult> {
  try {
    // Use our shared MDX processor which will throw errors if invalid
    await processMDXContent(content, contentType, { path });
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          type: "mdx-syntax",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

/**
 * Validate for absolute Mirascope URLs that should be relative
 * @param content - The content to validate
 * @param path - The file path (used to determine if exceptions should apply)
 * @param contentType - The type of content being validated
 */
function validateAbsoluteUrls(content: string, contentType?: ContentType): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = content.split("\n");
  const urlPattern = /https:\/\/mirascope\.com[^"\s)]*/g;

  // Skip validation for policy documents that need absolute URLs
  if (contentType === "policy") {
    return { isValid: true, errors: [] };
  }

  // Allowed absolute URLs that require redirects
  const allowedAbsoluteUrls = ["https://mirascope.com/discord-invite"];

  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].match(urlPattern);
    if (matches) {
      for (const match of matches) {
        // Skip validation if this is an allowed absolute URL
        if (allowedAbsoluteUrls.includes(match)) {
          continue;
        }

        errors.push({
          type: "absolute-url",
          message: `Absolute Mirascope URL found: "${match}". Use relative URLs instead.`,
          line: i + 1,
          context: lines[i].trim(),
        });
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Run all validators on MDX content
 */
async function validateMDXContent(
  content: string,
  path: string,
  contentType: ContentType
): Promise<ValidationResult> {
  // Run all validators
  const syntaxResult = await validateMDXSyntax(content, path, contentType);
  const urlsResult = validateAbsoluteUrls(content, contentType);

  // Merge all results
  const allErrors = [...syntaxResult.errors, ...urlsResult.errors];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validate all MDX files in a directory
 */
async function validateDirectory(
  dirPath: string,
  contentType: ContentType,
  relativePath = "",
  basePath?: string,
  recursive = false,
  ignoredChildren?: string[]
): Promise<{ count: number; errors: { file: string; validationErrors: ValidationError[] }[] }> {
  const errors: { file: string; validationErrors: ValidationError[] }[] = [];
  let count = 0;
  const validateAllFiles = !basePath;

  // Skip directories that don't match the base path if one is provided
  if (
    !validateAllFiles &&
    basePath &&
    !dirPath.startsWith(basePath) &&
    !basePath.startsWith(dirPath)
  ) {
    return { count, errors };
  }

  if (!fs.existsSync(dirPath)) {
    return { count, errors };
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemRelativePath = path.join(relativePath, item).replace(/\\/g, "/"); // Normalize Windows paths

    if (fs.statSync(itemPath).isDirectory() && recursive) {
      // Skip directories in ignoredChildren
      if (
        ignoredChildren?.some(
          (ignored) => itemRelativePath === ignored || itemRelativePath.startsWith(ignored + "/")
        )
      ) {
        continue;
      }

      // Recursively process subdirectories if recursive is true
      const subResults = await validateDirectory(
        itemPath,
        contentType,
        itemRelativePath,
        basePath,
        recursive,
        ignoredChildren
      );
      count += subResults.count;
      errors.push(...subResults.errors);
    } else if (item.endsWith(".mdx")) {
      // Skip files that don't match the base path if one is provided
      if (
        !validateAllFiles &&
        basePath &&
        !itemPath.startsWith(basePath) &&
        !basePath.startsWith(itemPath)
      ) {
        continue;
      }

      count++;
      const fileContent = fs.readFileSync(itemPath, "utf-8");

      // Extract frontmatter and process CodeExamples to validate the processed content
      const { content } = preprocessMdx(fileContent, {
        basePath: path.join(process.cwd(), "content"),
        filePath: itemPath,
      });

      const validationResult = await validateMDXContent(content, itemPath, contentType);
      if (validationResult.isValid) {
        process.stdout.write(".");
      } else {
        process.stdout.write("X");
        errors.push({
          file: `${path.relative(process.cwd(), itemPath)}`,
          validationErrors: validationResult.errors,
        });
      }
    }
  }

  return { count, errors };
}

/**
 * Validate all MDX files in the project
 */
async function validateMDX(basePath?: string): Promise<void> {
  // Keep track of errors
  const errors: { file: string; validationErrors: ValidationError[] }[] = [];

  // Determine if we're validating a specific path or everything
  const validateAllFiles = !basePath;

  // If base path is provided, normalize it
  if (basePath) {
    basePath = path.resolve(basePath);
  }

  // Get the root directory
  const rootDir = process.cwd();

  // Validate each content location
  for (const location of contentLocations) {
    const contentDir = path.join(rootDir, location.dir);

    // Only validate if base path is not provided or it includes the content directory
    if (
      validateAllFiles ||
      (basePath && (contentDir.startsWith(basePath) || basePath.startsWith(contentDir)))
    ) {
      console.log(`\n${location.emoji} Validating ${location.label}...`);

      const results = await validateDirectory(
        contentDir,
        location.type,
        "",
        basePath,
        location.recursive,
        location.ignoredChildren
      );

      errors.push(...results.errors);
      console.log(`\n✅ Checked ${results.count} ${location.label}`);
    }
  }

  // Print error report
  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} MDX files with errors:`);

    for (let i = 0; i < errors.length; i++) {
      const { file, validationErrors } = errors[i];
      console.error(`\n❌ File ${i + 1}/${errors.length}: ${file}`);

      // Group errors by type
      const syntaxErrors = validationErrors.filter((e) => e.type === "mdx-syntax");
      const urlErrors = validationErrors.filter((e) => e.type === "absolute-url");

      // Display absolute URL errors first since they're more specific
      if (urlErrors.length > 0) {
        console.error(`\n  Found ${urlErrors.length} absolute URL issues:`);
        for (const err of urlErrors) {
          console.error(`  → Line ${err.line}: ${err.message}`);
          if (err.context) {
            console.error(`    Context: ${err.context}`);
          }
        }
      }

      // Then display MDX syntax errors if any
      if (syntaxErrors.length > 0) {
        console.error(`\n  Found ${syntaxErrors.length} MDX syntax issues:`);
        for (const err of syntaxErrors) {
          console.error(`  → ${err.message}`);
        }

        // Try to compile the MDX to get more detailed error messages
        try {
          const fileContent = fs.readFileSync(path.join(rootDir, file), "utf-8");
          const { content } = preprocessMdx(fileContent, {
            basePath: path.join(process.cwd(), "content"),
            filePath: path.join(rootDir, file),
          });
          const { serialize } = await import("next-mdx-remote/serialize");
          await serialize(content);
        } catch (error) {
          console.error(error);
        }
      }

      console.error("\n---\n");
    }

    console.error("\n❌ MDX validation failed. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log("\n🎉 All MDX files are valid!");
  }
}

/**
 * Validate a single MDX file
 */
async function validateSingleFile(filepath: string): Promise<boolean> {
  if (!fs.existsSync(filepath) || !filepath.endsWith(".mdx")) {
    console.error(`❌ Not a valid MDX file: ${filepath}`);
    return false;
  }

  const absolutePath = path.resolve(filepath);
  const rootDir = process.cwd();

  // Skip files in content/llms directory (template files with {{include}} directives)
  const llmsDir = path.join(rootDir, "content/llms");
  if (absolutePath.startsWith(llmsDir)) {
    console.log(`⏭️  Skipping template file: ${path.relative(rootDir, filepath)}`);
    return true; // Return true to indicate this file doesn't need validation
  }

  try {
    const fileContent = fs.readFileSync(filepath, "utf-8");
    const { content } = preprocessMdx(fileContent, {
      basePath: path.join(process.cwd(), "content"),
      filePath: filepath,
    });

    // Determine content type from path based on the contentLocations config
    let contentType: ContentType = "dev"; // Default content type

    for (const location of contentLocations) {
      const contentDir = path.join(rootDir, location.dir);
      if (absolutePath.startsWith(contentDir)) {
        contentType = location.type;
        break;
      }
    }

    const validationResult = await validateMDXContent(content, filepath, contentType);
    if (validationResult.isValid) {
      console.log(`✅ Valid MDX: ${filepath}`);
      return true;
    } else {
      console.error(`❌ Invalid MDX: ${filepath}`);

      // Group errors by type
      const syntaxErrors = validationResult.errors.filter((e) => e.type === "mdx-syntax");
      const urlErrors = validationResult.errors.filter((e) => e.type === "absolute-url");

      // Display absolute URL errors first since they're more specific
      if (urlErrors.length > 0) {
        console.error(`\n  Found ${urlErrors.length} absolute URL issues:`);
        for (const err of urlErrors) {
          console.error(`  → Line ${err.line}: ${err.message}`);
          if (err.context) {
            console.error(`    Context: ${err.context}`);
          }
        }
      }

      // Then display MDX syntax errors if any
      if (syntaxErrors.length > 0) {
        console.error(`\n  Found ${syntaxErrors.length} MDX syntax issues:`);
        for (const err of syntaxErrors) {
          console.error(`  → ${err.message}`);
        }

        try {
          // Try to compile the MDX to get the detailed error message
          const { serialize } = await import("next-mdx-remote/serialize");
          await serialize(content);
        } catch (error) {
          console.error(error);
        }
      }

      return false;
    }
  } catch (error) {
    console.error(`❌ Error reading or validating file ${filepath}:`, error);
    return false;
  }
}

// Process command line arguments
const args = process.argv.slice(2);

// If there are no args, validate all files
if (args.length === 0) {
  validateMDX().catch((error) => {
    console.error("Validation failed with error:", error);
    process.exit(1);
  });
}
// If there are multiple arguments, validate each file individually
else if (args.length > 0) {
  // Keep track of validation status
  let hasErrors = false;
  let pendingValidations = args.length;

  console.log(`Validating ${args.length} MDX files...`);

  // Validate each file path
  args.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Path does not exist: ${filePath}`);
      hasErrors = true;
      pendingValidations--;

      if (pendingValidations === 0) {
        if (hasErrors) process.exit(1);
      }
      return;
    }

    // Check if it's a directory or file
    if (fs.statSync(filePath).isDirectory()) {
      // For directories, run the full validation function with that path
      validateMDX(filePath)
        .then(() => {
          pendingValidations--;
          if (pendingValidations === 0 && hasErrors) process.exit(1);
        })
        .catch((error) => {
          console.error(`Error validating directory ${filePath}:`, error);
          hasErrors = true;
          pendingValidations--;
          if (pendingValidations === 0) process.exit(1);
        });
    } else {
      // For a single file, use the single file validator
      validateSingleFile(filePath)
        .then((isValid) => {
          if (!isValid) hasErrors = true;
          pendingValidations--;
          if (pendingValidations === 0 && hasErrors) process.exit(1);
        })
        .catch((error) => {
          console.error(`Error validating file ${filePath}:`, error);
          hasErrors = true;
          pendingValidations--;
          if (pendingValidations === 0) process.exit(1);
        });
    }
  });
}
