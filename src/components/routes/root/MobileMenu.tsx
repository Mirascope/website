import { Link } from "@tanstack/react-router";
import { getProductRoute } from "@/src/lib/routes";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import type { ProductName } from "@/src/lib/content/spec";
import { NAV_LINK_STYLES, PRODUCT_LINK_STYLES, MOBILE_MENU_STYLES } from "./styles";

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
    <div className={MOBILE_MENU_STYLES.container}>
      <div className={MOBILE_MENU_STYLES.content}>
        <div className={MOBILE_MENU_STYLES.sectionTitle}>Docs</div>

        <MobileProductLink productName="mirascope" onClick={onClose} />
        <MobileProductLink productName="lilypad" onClick={onClose} />

        <hr className={MOBILE_MENU_STYLES.divider} />

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
