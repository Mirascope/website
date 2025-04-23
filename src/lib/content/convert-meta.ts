/**
 * Conversion script for metadata
 *
 * This script helps convert existing metadata to the new DocSpec format.
 */
import type { DocsStructure } from "./legacy-doc-meta";
import { toNewFormat } from "./doc-converter";
import fs from "fs";
import path from "path";

// Import legacy metadata
import meta from "@/content/doc/_meta";

/**
 * Converts the metadata for a specific product to the new format.
 *
 * @param productName The name of the product to convert
 * @returns The metadata in DocSpec format
 */
function convertProductToNewFormat(productName: string): string {
  // Get legacy metadata for the product
  const productMeta = meta[productName];

  if (!productMeta) {
    throw new Error(`Product "${productName}" not found in metadata`);
  }

  // Create a temporary structure with just this product
  const tempStructure: DocsStructure = {
    [productName]: productMeta,
  };

  // Convert to new format
  const newFormat = toNewFormat(tempStructure);

  // Extract just the product's data
  const productSpec = newFormat[productName];

  // Generate TypeScript code
  return `import type { ProductSpec } from "@/src/lib/content/spec";
import { toLegacyFormat } from "@/src/lib/content/doc-converter";
import type { ProductDocs } from "@/src/lib/content/legacy-doc-meta";

/**
 * Documentation structure for ${productName} in new DocSpec format
 */
const ${productName}Spec: ProductSpec = ${JSON.stringify(productSpec, null, 2)};

// Convert to legacy format for compatibility
const ${productName}Meta: ProductDocs = toLegacyFormat({ ${productName}: ${productName}Spec }).${productName};

export default ${productName}Meta;
`;
}

// Write the conversion result to a file
if (process.argv.length < 3) {
  console.error("Usage: bun run src/lib/content/convert-meta.ts [product-name]");
  process.exit(1);
}

const productName = process.argv[2];
const outputContent = convertProductToNewFormat(productName);
const outputPath = path.resolve(process.cwd(), `content/doc/${productName}/_meta.ts`);

fs.writeFileSync(outputPath, outputContent, "utf8");
console.log(`Wrote new format to ${outputPath}`);
