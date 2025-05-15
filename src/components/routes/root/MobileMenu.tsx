import { Link } from "@tanstack/react-router";
import { getProductRoute } from "@/src/lib/routes";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import type { ProductName } from "@/src/lib/content/spec";
import { NAV_LINK_STYLES, PRODUCT_LINK_STYLES } from "./styles";

interface MobileMenuProps {
  /**
   * Whether the mobile menu is open
   */
  isOpen: boolean;
  /**
   * Function to close the mobile menu
   */
  onClose: () => void;
}

/**
 * Mobile menu product link component
 */
interface MobileProductLinkProps {
  productName: ProductName;
  onClick: () => void;
}

const MobileProductLink = ({ productName, onClick }: MobileProductLinkProps) => {
  const config = PRODUCT_CONFIGS[productName];

  return (
    <Link
      to={getProductRoute(productName)}
      className={PRODUCT_LINK_STYLES.mobile.container}
      onClick={onClick}
      data-product={productName}
    >
      {config.title}
    </Link>
  );
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="text-foreground bg-background absolute top-full right-4 z-50 mt-2 max-w-xs rounded-lg p-6 shadow-lg [text-shadow:none] md:hidden">
      <div className="flex flex-col space-y-4">
        <div className="my-2 text-xl font-medium">Docs</div>

        <MobileProductLink productName="mirascope" onClick={onClose} />
        <MobileProductLink productName="lilypad" onClick={onClose} />

        <hr className="my-2" />

        <Link to="/blog" className={NAV_LINK_STYLES.mobile} onClick={onClose}>
          Blog
        </Link>

        <Link to="/pricing" className={NAV_LINK_STYLES.mobile} onClick={onClose}>
          Pricing
        </Link>
      </div>
    </div>
  );
}
