import { useMemo } from "react";
import { BASE_URL, PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import { useRouterState } from "@tanstack/react-router";
import { routeToFilename } from "@/src/lib/utils";
import { RouteMeta } from "./RouteMeta";
import type { ProductName } from "@/src/lib/content/spec";
export interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  product?: ProductName;
  robots?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
}

// Helper function to convert a route path to a consistent image path
export function routeToImagePath(route: string): string {
  const filename = routeToFilename(route);
  return `/social-cards/${filename}.webp`;
}

export function PageMeta(props: PageMetaProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const { title, description, image, url, type = "website", product, article, robots } = props;

  // Calculate metadata values
  const siteTitle = product ? `${PRODUCT_CONFIGS[product].title}` : "Mirascope";
  const pageTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  // Generate image path if not provided
  const computedImage = useMemo(() => {
    if (image) return image;

    // Use the generated social image path for this route
    const generatedImage = routeToImagePath(currentPath);
    return generatedImage;
  }, [image, currentPath]);

  // Handle URL construction
  const ogUrl = url
    ? url.startsWith("http")
      ? url
      : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`
    : `${BASE_URL}${currentPath}`;

  // Create canonical URL with trailing slash removed for all URLs
  const canonicalUrl = ogUrl.endsWith("/") ? ogUrl.slice(0, -1) : ogUrl;

  // Create absolute image URL
  const ogImage = computedImage.startsWith("http")
    ? computedImage
    : `${BASE_URL}${computedImage.startsWith("/") ? computedImage : `/${computedImage}`}`;

  return (
    <RouteMeta>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {robots && <meta name="robots" content={robots} />}

      {/* Canonical URL - self-referencing to prevent duplicate content issues */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={ogUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article specific metadata */}
      {type === "article" && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === "article" && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === "article" && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {type === "article" &&
        article?.tags &&
        article.tags.map((tag, index) => (
          <meta key={`tag-${index}`} property="article:tag" content={tag} />
        ))}
    </RouteMeta>
  );
}

export default PageMeta;
