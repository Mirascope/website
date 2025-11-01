import type { BaseLogoProps } from "./logoUtils";
import { MirascopeLogo, LilypadLogo, useProduct } from "@/src/components/core";

/**
 * Reusable Logo component with customizable size and text display
 * Automatically swaps between Mirascope and Lilypad logos based on
 * product context.
 */
const ProductLogo: React.FC<BaseLogoProps> = (props) => {
  const productName = useProduct();

  switch (productName) {
    case "lilypad":
      return <LilypadLogo {...props} />;
    case "mirascope":
    case "mirascope-v2":
      return <MirascopeLogo {...props} />;
    default:
      throw new Error(`Unknown product: ${productName}`);
  }
};

export default ProductLogo;
