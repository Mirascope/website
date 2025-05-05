import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { getProductRoute } from "@/src/lib/routes";
import { setDevProductPreference } from "@/src/lib/utils";
import { type ProductName } from "@/src/lib/content/spec";

// Shared styles and components
const ProductTitle = ({ product }: { product: ProductName }) => {
  const titleClass = `text-xl font-medium ${product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green"}`;
  return <span className={titleClass}>{product === "mirascope" ? "Mirascope" : "Lilypad"}</span>;
};

const ProductLink = ({ product }: { product: ProductName }) => {
  const hoverClass =
    product === "mirascope" ? "hover:text-mirascope-purple" : "hover:text-lilypad-green";
  return (
    <Link
      to={getProductRoute(product)}
      className={`text-muted-foreground text-xl font-medium ${hoverClass}`}
    >
      {product === "mirascope" ? "Mirascope" : "Lilypad"}
    </Link>
  );
};

/**
 * DocsProductSelector - Shows current product title and link to other product
 */
export function DocsProductSelector({ currentProduct }: { currentProduct: ProductName }) {
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

/**
 * DevProductSelector - Interactive buttons to switch product theme in dev mode
 */
export function DevProductSelector({ currentProduct }: { currentProduct: ProductName }) {
  const router = useRouter();
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  const handleProductChange = (product: ProductName) => {
    // Save preference to session storage
    setDevProductPreference(product);

    // Update URL search params
    router.navigate({
      to: path,
      search: (prev: Record<string, unknown>) => ({ ...prev, product }),
      replace: true,
    });
  };

  return (
    <div className="flex space-x-6 px-1">
      <button
        className={`text-xl font-medium ${
          currentProduct === "mirascope"
            ? "text-mirascope-purple"
            : "text-muted-foreground hover:text-mirascope-purple"
        }`}
        onClick={() => handleProductChange("mirascope")}
      >
        Mirascope
      </button>
      <button
        className={`text-xl font-medium ${
          currentProduct === "lilypad"
            ? "text-lilypad-green"
            : "text-muted-foreground hover:text-lilypad-green"
        }`}
        onClick={() => handleProductChange("lilypad")}
      >
        Lilypad
      </button>
    </div>
  );
}
