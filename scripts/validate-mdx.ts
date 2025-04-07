import fs from "fs";
import path from "path";

/**
 * Validate MDX file directly against the MDX compiler
 */
async function validateMDXContent(content: string): Promise<boolean> {
  try {
    // Dynamically import next-mdx-remote/serialize since it's an ESM module
    const { serialize } = await import("next-mdx-remote/serialize");

    // Try to compile the MDX content - this will throw if invalid
    await serialize(content);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts frontmatter from MDX content
 */
function extractFrontmatter(source: string): {
  content: string;
  frontmatter: Record<string, string>;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = source.match(frontmatterRegex);

  if (!match) {
    return { content: source, frontmatter: {} };
  }

  const frontmatterStr = match[1];
  const content = match[2];

  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1");
      frontmatter[key] = value;
    }
  }

  return { content, frontmatter };
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

  // Validate blog posts
  const postsDir = path.join(rootDir, "src", "posts");

  // Only validate posts if base path is not provided or it includes the posts directory
  if (
    validateAllFiles ||
    (basePath && (postsDir.startsWith(basePath) || basePath.startsWith(postsDir)))
  ) {
    console.log("\n📝 Validating blog posts...");

    const postFiles = fs
      .readdirSync(postsDir)
      .filter((file) => file.endsWith(".mdx"))
      // If base path is provided, only include files that match the path
      .filter((file) => {
        const filePath = path.join(postsDir, file);
        return (
          validateAllFiles ||
          (basePath && (filePath.startsWith(basePath) || basePath.startsWith(filePath)))
        );
      });

    for (const filename of postFiles) {
      const filepath = path.join(postsDir, filename);
      const fileContent = fs.readFileSync(filepath, "utf-8");

      // Extract frontmatter to validate just the content
      const { content } = extractFrontmatter(fileContent);

      const isValid = await validateMDXContent(content);
      if (isValid) {
        process.stdout.write(".");
      } else {
        process.stdout.write("X");
        errors.push({ file: filename, content });
      }
    }

    console.log(`\n✅ Checked ${postFiles.length} blog posts`);
  }

  // Validate docs files recursively
  const docsDir = path.join(rootDir, "src", "docs");

  // Only validate docs if base path is not provided or it includes the docs directory
  if (
    validateAllFiles ||
    (basePath && (docsDir.startsWith(basePath) || basePath.startsWith(docsDir)))
  ) {
    console.log("\n📚 Validating documentation files...");
    let docFilesCount = 0;

    async function validateDirectory(dirPath: string, relativePath = ""): Promise<void> {
      // Skip directories that don't match the base path if one is provided
      if (
        !validateAllFiles &&
        basePath &&
        !dirPath.startsWith(basePath) &&
        !basePath.startsWith(dirPath)
      ) {
        return;
      }

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item).replace(/\\/g, "/"); // Normalize Windows paths

        if (fs.statSync(itemPath).isDirectory()) {
          await validateDirectory(itemPath, itemRelativePath);
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

          docFilesCount++;
          const fileContent = fs.readFileSync(itemPath, "utf-8");

          // Extract frontmatter to validate just the content
          const { content } = extractFrontmatter(fileContent);

          const isValid = await validateMDXContent(content);
          if (isValid) {
            process.stdout.write(".");
          } else {
            process.stdout.write("X");
            errors.push({ file: `docs/${itemRelativePath}`, content });
          }
        }
      }
    }

    await validateDirectory(docsDir);
    console.log(`\n✅ Checked ${docFilesCount} documentation files`);
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
    const { content } = extractFrontmatter(fileContent);

    const isValid = await validateMDXContent(content);
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
