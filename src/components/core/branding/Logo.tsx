import React from "react";
import { cn } from "@/src/lib/utils";

interface LogoProps {
  size?: "micro" | "small" | "medium" | "large";
  withText?: boolean;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
  containerClassName?: string;
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
  // Size mappings for the logo
  const sizeMap = {
    micro: {
      container: "w-auto",
      img: "h-4 w-auto",
      text: "text-s",
      spacing: "mr-1.5",
      wrapper: "px-1.5 py-0.5",
    },
    small: {
      container: "w-auto",
      img: "h-7 w-auto",
      text: "text-2xl",
      spacing: "mr-2",
      wrapper: "px-4 py-2",
    },
    medium: {
      container: "w-auto",
      img: "h-10 w-auto",
      text: "text-3xl",
      spacing: "mr-3",
      wrapper: "px-5 py-2.5",
    },
    large: {
      container: "w-auto",
      img: "w-16 h-auto",
      text: "text-5xl",
      spacing: "mr-4",
      wrapper: "px-6 py-3",
    },
  };

  const selectedSize = sizeMap[size];

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
