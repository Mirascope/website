import React from "react";
import { cn } from "@/src/lib/utils";
import { logoSizeMap } from "./logoUtils";
import type { BaseLogoProps } from "./logoUtils";

interface LogoProps extends BaseLogoProps {
  showLilypad?: boolean;
}

/**
 * Reusable Logo component with customizable size and text display
 * Can toggle between Mirascope and Lilypad logos with the showLilypad prop
 * The text always displays "Mirascope" as it's the company brand
 */
const Logo: React.FC<LogoProps> = ({
  size = "medium",
  withText = true,
  className,
  textClassName,
  imgClassName,
  containerClassName,
  showLilypad = false,
}) => {
  const selectedSize = logoSizeMap[size];

  // Choose logo based on showLilypad flag
  const logoPath = showLilypad
    ? "/assets/branding/lilypad-logo.svg"
    : "/assets/branding/mirascope-logo.svg";

  const logoContent = (
    <div className={cn("flex flex-row items-center justify-center", containerClassName)}>
      <div className={cn(selectedSize.spacing, imgClassName)}>
        <img
          src={logoPath}
          alt="Mirascope Frog Logo"
          className={cn(selectedSize.img, imgClassName)}
        />
      </div>

      {withText && (
        <h1
          className={cn(
            selectedSize.text,
            "text-mirascope-purple font-handwriting mb-0",
            textClassName
          )}
        >
          Mirascope
        </h1>
      )}
    </div>
  );

  return <div className={className}>{logoContent}</div>;
};

export default Logo;
