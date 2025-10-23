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

function V2Badge({ isActive, route }: { isActive: boolean; route: string }) {
  const activeClass = "bg-secondary text-secondary-foreground border-secondary";
  const inactiveClass =
    "text-muted-foreground border-muted-foreground hover:border-secondary hover:text-secondary";
  const baseClass = "absolute -top-1 -right-2 text-2xs font-semibold border rounded-lg px-1";

  if (isActive) {
    return <span className={`${baseClass} ${activeClass}`}>v2</span>;
  }

  return (
    <Link to={route} className={`${baseClass} transition-colors ${inactiveClass}`}>
      v2
    </Link>
  );
}

function MirascopeSelector({
  currentProduct,
  currentPath,
}: {
  currentProduct: ProductName;
  currentPath: string;
}) {
  const isV1 = currentProduct === "mirascope";
  const isV2 = currentProduct === "mirascope-v2";
  const isMirascope = isV1 || isV2;

  const v1Route = getSmartProductRoute("mirascope", currentPath);
  const v2Route = getSmartProductRoute("mirascope-v2", currentPath);

  return (
    <div className="relative pr-4">
      {isMirascope ? (
        isV2 ? (
          <Link to={v1Route} className="text-mirascope-purple text-lg font-medium hover:opacity-80">
            Mirascope
          </Link>
        ) : (
          <span className="text-mirascope-purple text-lg font-medium">Mirascope</span>
        )
      ) : (
        <Link
          to={v1Route}
          className="text-muted-foreground hover:text-mirascope-purple text-lg font-medium"
        >
          Mirascope
        </Link>
      )}

      <V2Badge isActive={isV2} route={v2Route} />
    </div>
  );
}

/**
 * LilypadSelector - Shows Lilypad as active or link based on current product
 */
function LilypadSelector({
  currentProduct,
  currentPath,
}: {
  currentProduct: ProductName;
  currentPath: string;
}) {
  const isActive = currentProduct === "lilypad";

  if (isActive) {
    return <span className="text-lilypad-green text-lg font-medium">Lilypad</span>;
  }

  const route = getSmartProductRoute("lilypad", currentPath);
  return (
    <Link to={route} className="text-muted-foreground hover:text-lilypad-green text-lg font-medium">
      Lilypad
    </Link>
  );
}

/**
 * DocsProductSelector - Shows current product title and link to other product
 */
export function DocsProductSelector() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const currentProduct = useProduct();

  return (
    <div className="flex space-x-4 px-1">
      <MirascopeSelector currentProduct={currentProduct} currentPath={currentPath} />
      <LilypadSelector currentProduct={currentProduct} currentPath={currentPath} />
    </div>
  );
}
