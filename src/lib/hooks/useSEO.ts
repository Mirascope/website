import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { PRODUCT_CONFIGS } from "../constants/site";
import { routeToFilename } from "../utils";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  product?: keyof typeof PRODUCT_CONFIGS;
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

const DEFAULT_DESCRIPTION = "Mirascope provides LLM abstractions that aren't obstructions.";
const DEFAULT_IMAGE = "/social-cards/_default.webp";

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
  product,
  article,
}: SEOProps) {
  const router = useRouter();
  const [socialImage, setSocialImage] = useState<string | null>(null);

  // Effect to get the OG image for the current route
  useEffect(() => {
    // If custom image is provided, use that instead of generated one
    if (image) {
      setSocialImage(null);
      return;
    }

    const currentPath = router.state.location.pathname;

    // Try to use the generated social image for this route
    const generatedImagePath = routeToImagePath(currentPath);

    // Check if the file exists
    fetch(generatedImagePath)
      .then((response) => {
        if (response.ok) {
          setSocialImage(generatedImagePath);
        } else {
          // Fall back to null to use default or custom image
          setSocialImage(null);
        }
      })
      .catch(() => {
        // On error, use null to fall back
        setSocialImage(null);
      });
  }, [router.state.location.pathname, image]);

  useEffect(() => {
    // Calculate values
    const siteTitle = product ? `${PRODUCT_CONFIGS[product].title}` : "Mirascope";
    const pageTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    const metaDescription =
      description || (product ? PRODUCT_CONFIGS[product].description : DEFAULT_DESCRIPTION);

    // Get the current base URL from the browser
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    // Normalize image path - use social image if available, otherwise use custom image or default
    const ogImage = socialImage || image || DEFAULT_IMAGE;

    // Create URLs with proper joining
    const ogUrl = url
      ? new URL(url.startsWith("/") ? url : `/${url}`, baseUrl).toString()
      : typeof window !== "undefined"
        ? window.location.href
        : baseUrl;

    // Only add baseUrl for relative image paths
    const absoluteImageUrl = ogImage.startsWith("http")
      ? ogImage
      : new URL(ogImage.startsWith("/") ? ogImage : `/${ogImage}`, baseUrl).toString();

    // Set the document title
    document.title = pageTitle;

    // Helper function to set meta tag content
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.querySelector(`meta[name="${property}"]`);
      }

      if (meta) {
        meta.setAttribute("content", content);
      } else {
        // Create meta tag if it doesn't exist
        meta = document.createElement("meta");
        if (property.startsWith("og:") || property.startsWith("article:")) {
          meta.setAttribute("property", property);
        } else {
          meta.setAttribute("name", property);
        }
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    // Set standard meta
    setMetaTag("description", metaDescription);

    // Set Open Graph meta
    setMetaTag("og:type", type);
    setMetaTag("og:url", ogUrl);
    setMetaTag("og:title", pageTitle);
    setMetaTag("og:description", metaDescription);
    setMetaTag("og:image", absoluteImageUrl);

    // Set Twitter meta
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:url", ogUrl);
    setMetaTag("twitter:title", pageTitle);
    setMetaTag("twitter:description", metaDescription);
    setMetaTag("twitter:image", absoluteImageUrl);

    // Set article-specific meta
    if (type === "article") {
      if (article?.publishedTime) {
        setMetaTag("article:published_time", article.publishedTime);
      }
      if (article?.modifiedTime) {
        setMetaTag("article:modified_time", article.modifiedTime);
      }
      if (article?.author) {
        setMetaTag("article:author", article.author);
      }
      if (article?.tags) {
        // Remove any existing article tags
        document.querySelectorAll('meta[property^="article:tag"]').forEach((el) => el.remove());

        // Add new tags
        article.tags.forEach((tag) => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "article:tag");
          meta.setAttribute("content", tag);
          document.head.appendChild(meta);
        });
      }
    }

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      // We don't reset the meta tags here as it might cause flickering
      // between route changes. Instead, they will be overwritten by the
      // next component that uses useSEO
    };
  }, [
    title,
    description,
    image,
    socialImage,
    url,
    type,
    product,
    article,
    router.state.location.pathname,
  ]);
}

export default useSEO;
