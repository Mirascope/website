import { Link, useRouterState } from "@tanstack/react-router";
import { getProductRoute } from "@/src/lib/routes";
import { type ProductName } from "@/src/lib/content/spec";
import { useProduct } from "@/src/components";
import { getAllDocInfo } from "@/src/lib/content";
import { canonicalizePath } from "@/src/lib/utils";

// Build cache of valid doc paths at module level
const validDocPaths = new Set<string>();

function buildValidDocPaths() {
  const allDocs = getAllDocInfo();
  allDocs.forEach((doc) => {
    validDocPaths.add(canonicalizePath(doc.routePath));
  });

  // Add special llms-full routes manually
  validDocPaths.add("/docs/mirascope/llms-full");
  validDocPaths.add("/docs/mirascope-v2/llms-full");
  validDocPaths.add("/docs/lilypad/llms-full");
}

// Initialize cache when module loads
buildValidDocPaths();

/**
 * Smart navigation: tries to map current path to equivalent path for target product
 * Falls back to progressively shorter paths until finding a valid route
 */
function getSmartProductRoute(targetProduct: ProductName, currentPath: string): string {
  // If not in docs section, use default product route
  if (!currentPath.startsWith("/docs/")) {
    return getProductRoute(targetProduct);
  }

  // Parse current path: /docs/{product}/{...rest}
  const pathParts = currentPath.split("/").filter(Boolean);
  if (pathParts.length < 2 || pathParts[0] !== "docs") {
    return getProductRoute(targetProduct);
  }

  const currentProduct = pathParts[1];
  const restOfPath = pathParts.slice(2);

  // If already on the target product, return current path
  if (currentProduct === targetProduct) {
    return currentPath;
  }

  // Try full path substitution first
  if (restOfPath.length > 0) {
    const fullPath = `/docs/${targetProduct}/${restOfPath.join("/")}`;
    if (validDocPaths.has(canonicalizePath(fullPath))) {
      return fullPath;
    }

    // Try progressively shorter paths
    for (let i = restOfPath.length - 1; i > 0; i--) {
      const shorterPath = `/docs/${targetProduct}/${restOfPath.slice(0, i).join("/")}`;
      if (validDocPaths.has(canonicalizePath(shorterPath))) {
        return shorterPath;
      }
    }
  }

  // Fallback to base product route
  return getProductRoute(targetProduct);
}

// Shared styles and components
const ProductTitle = ({ product }: { product: ProductName }) => {
  const titleClass = `text-lg font-medium ${product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green"}`;
  return <span className={titleClass}>{product === "mirascope" ? "Mirascope" : "Lilypad"}</span>;
};

const ProductLink = ({ product }: { product: ProductName }) => {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const smartRoute = getSmartProductRoute(product, currentPath);

  const hoverClass =
    product === "mirascope" ? "hover:text-mirascope-purple" : "hover:text-lilypad-green";
  return (
    <Link to={smartRoute} className={`text-muted-foreground text-lg font-medium ${hoverClass}`}>
      {product === "mirascope" ? "Mirascope" : "Lilypad"}
    </Link>
  );
};

/**
 * DocsProductSelector - Shows current product title and link to other product
 */
export function DocsProductSelector() {
  const currentProduct = useProduct();
  return (
    <div className="flex space-x-4 px-1">
      {currentProduct === "mirascope" ? (
        <ProductTitle product="mirascope" />
      ) : (
        <ProductLink product="mirascope" />
      )}

      {currentProduct === "lilypad" ? (
        <ProductTitle product="lilypad" />
      ) : (
        <ProductLink product="lilypad" />
      )}
    </div>
  );
}
