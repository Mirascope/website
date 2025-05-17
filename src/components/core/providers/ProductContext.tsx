import { createContext, useContext, type ReactNode } from "react";
import type { ProductName } from "@/src/lib/content/spec";

export type { ProductName };

// Create the context with default value
const ProductContext = createContext<ProductName>("mirascope");

// Hook for components to use the product
export function useProduct() {
  return useContext(ProductContext);
}

interface ProductProviderProps {
  children: ReactNode;
  product: ProductName;
}

// Product provider component
export function ProductProvider({ children, product }: ProductProviderProps) {
  // Apply product attribute for styling
  const productAttr = { "data-product": product };

  return (
    <ProductContext.Provider value={product}>
      <div {...productAttr} className="h-full">
        {children}
      </div>
    </ProductContext.Provider>
  );
}
