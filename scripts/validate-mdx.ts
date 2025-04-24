import fs from "fs";
import path from "path";
import { parseFrontmatter, processMDXContent, type ContentType } from "@/src/lib/content";

// Define content locations
interface ContentLocation {
  dir: string;
  type: ContentType;
  emoji: string;
  label: string;
  recursive: boolean;
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
    dir: "content/doc",
    type: "doc",
    emoji: "📚",
    label: "documentation files",
    recursive: true,
  },
  {
    dir: "content/policy",
    type: "policy",
    emoji: "📜",
    label: "policy documents",
    recursive: true,
  },
];

/**
 * Validate MDX file directly against our MDX processor
 */
async function validateMDXContent(
  content: string,
  path: string,
  contentType: ContentType
): Promise<boolean> {
  try {
    // Use our shared MDX processor which will throw errors if invalid
    await processMDXContent(content, contentType, { path });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate all MDX files in a directory
 */
async function validateDirectory(
  dirPath: string,
  contentType: ContentType,
  relativePath = "",
  basePath?: string,
  recursive = false
): Promise<{ count: number; errors: { file: string; content: string }[] }> {
  const errors: { file: string; content: string }[] = [];
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
      // Recursively process subdirectories if recursive is true
      const subResults = await validateDirectory(
        itemPath,
        contentType,
        itemRelativePath,
        basePath,
        recursive
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

      // Extract frontmatter to validate just the content
      const { content } = parseFrontmatter(fileContent);

      const isValid = await validateMDXContent(content, itemPath, contentType);
      if (isValid) {
        process.stdout.write(".");
      } else {
        process.stdout.write("X");
        errors.push({
          file: `${path.relative(process.cwd(), itemPath)}`,
          content,
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
  const errors: { file: string; content: string }[] = [];

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
        location.recursive
      );

      errors.push(...results.errors);
      console.log(`\n✅ Checked ${results.count} ${location.label}`);
    }
  }

  // Print error report
  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} MDX files with errors:`);

    for (let i = 0; i < errors.length; i++) {
      const { file, content } = errors[i];
      console.error(`\n❌ Error ${i + 1}/${errors.length} in file: ${file}`);

      try {
        // Try to compile the MDX to get the detailed error message
        const { serialize } = await import("next-mdx-remote/serialize");
        await serialize(content);
      } catch (error) {
        console.error(error);
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

  try {
    const fileContent = fs.readFileSync(filepath, "utf-8");
    const { content } = parseFrontmatter(fileContent);

    // Determine content type from path based on the contentLocations config
    let contentType: ContentType = "dev"; // Default content type

    const absolutePath = path.resolve(filepath);
    const rootDir = process.cwd();

    for (const location of contentLocations) {
      const contentDir = path.join(rootDir, location.dir);
      if (absolutePath.startsWith(contentDir)) {
        contentType = location.type;
        break;
      }
    }

    const isValid = await validateMDXContent(content, filepath, contentType);
    if (isValid) {
      console.log(`✅ Valid MDX: ${filepath}`);
      return true;
    } else {
      console.error(`❌ Invalid MDX: ${filepath}`);

      try {
        // Try to compile the MDX to get the detailed error message
        const { serialize } = await import("next-mdx-remote/serialize");
        await serialize(content);
      } catch (error) {
        console.error(error);
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
