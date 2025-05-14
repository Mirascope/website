import { Link } from "@tanstack/react-router";
import { getProductRoute } from "@/src/lib/routes";
import { type ProductName } from "@/src/lib/content/spec";
import { useProduct } from "@/src/components";

// Shared styles and components
const ProductTitle = ({ product }: { product: ProductName }) => {
  const titleClass = `text-lg font-medium ${product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green"}`;
  return <span className={titleClass}>{product === "mirascope" ? "Mirascope" : "Lilypad"}</span>;
};

const ProductLink = ({ product }: { product: ProductName }) => {
  const hoverClass =
    product === "mirascope" ? "hover:text-mirascope-purple" : "hover:text-lilypad-green";
  return (
    <Link
      to={getProductRoute(product)}
      className={`text-muted-foreground text-lg font-medium ${hoverClass}`}
    >
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
