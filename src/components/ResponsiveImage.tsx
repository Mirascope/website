import React from "react";
import { cn } from "@/src/lib/utils";

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Responsive image component for MDX content
 * - Automatically serves WebP versions of images
 * - Provides responsive versions based on viewport size
 * - Falls back to original image if WebP not supported
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  ...props
}) => {
  // Handle missing src or non-assets paths
  if (!src || !src.startsWith("/assets/")) {
    return <img src={src} alt={alt} className={className} {...props} />;
  }

  // Extract base path and extension
  const extension = src.split(".").pop()?.toLowerCase() || "";

  // Skip responsive handling for SVG or GIF files
  if (["svg", "gif"].includes(extension)) {
    return <img src={src} alt={alt} className={className} {...props} />;
  }

  // Prepare paths for WebP versions
  let basePath = src;

  // For non-WebP images, convert the path to WebP format
  if (extension !== "webp") {
    basePath = src.replace(`.${extension}`, "");
  } else {
    // For WebP images, just remove the extension
    basePath = src.replace(".webp", "");
  }

  // Construct WebP paths for different sizes
  const largeWebp = `${basePath}.webp`;
  const mediumWebp = `${basePath}-medium.webp`;
  const smallWebp = `${basePath}-small.webp`;

  return (
    <picture>
      {/* Small viewport */}
      <source media="(max-width: 640px)" srcSet={smallWebp} type="image/webp" />
      {/* Medium viewport */}
      <source media="(max-width: 1024px)" srcSet={mediumWebp} type="image/webp" />
      {/* Large viewport - WebP */}
      <source srcSet={largeWebp} type="image/webp" />
      {/* Original fallback */}
      <img src={src} alt={alt} className={cn("rounded-lg", className)} loading="lazy" {...props} />
    </picture>
  );
};

export default ResponsiveImage;
