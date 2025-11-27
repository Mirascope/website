/**
 * Utilities for working with VCR.py cassettes and Python code transformation
 */

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
