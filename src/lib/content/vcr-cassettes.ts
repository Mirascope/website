/**
 * Utilities for working with VCR.py cassettes and Python code transformation
 */

/**
 * Calculate the flat destination cassette path based on the original file path.
 *
 * Takes a relative path from the project root (e.g., "content/docs/mirascope/v2/examples/intro/decorator/async.py")
 * and converts it to a flat cassette path (e.g., "cassettes/docs_mirascope_v2_examples_intro_decorator_async.py.yaml")
 * by removing the first directory and joining the remaining parts with underscores.
 *
 * @param relativePath - Relative path from project root to the Python file
 * @returns The cassette path relative to the project root
 */
export function getCassettePath(relativePath: string): string {
  // Normalize path separators to forward slashes (works cross-platform)
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const pathParts = normalizedPath.split("/");
  pathParts.shift(); // Remove the first directory

  const cassetteName = pathParts.join("_") + ".yaml";
  return `cassettes/${cassetteName}`;
}

/**
 * Transform Python code to add VCR cassette decorator by injecting @vcr.use_cassette decorator
 * and ensuring the vcr import is present
 */
export function transformPythonWithVcrDecorator(content: string, yamlPath: string): string {
  const lines = content.split("\n");

  // Check if vcr is already imported
  const hasVcrImport = lines.some((line) => line.trim().startsWith("import vcr"));

  // Find the main function
  const mainFuncIndex = lines.findIndex((line) => line.includes("def main():"));

  if (mainFuncIndex === -1) {
    // No main function found, return as-is
    return content;
  }

  const transformed = [...lines];

  // Add VCR decorator before main function
  transformed.splice(mainFuncIndex, 0, `@vcr.use_cassette('${yamlPath}')`);

  // Add import if not present
  if (!hasVcrImport) {
    // Find the first import or add at the top
    const firstImportIndex = transformed.findIndex(
      (line) => line.trim().startsWith("import ") || line.trim().startsWith("from ")
    );
    if (firstImportIndex !== -1) {
      transformed.splice(firstImportIndex, 0, "import vcr");
    } else {
      transformed.unshift("import vcr");
    }
  }

  return transformed.join("\n");
}
