import { useEffect } from "react";
import { PRODUCT_CONFIGS } from "../constants/site";

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

const DEFAULT_DESCRIPTION = "Mirascope provides LLM abstractions that aren't obstructions.";
const DEFAULT_IMAGE = "/frog-logo.png";

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
  product,
  article,
}: SEOProps) {
  useEffect(() => {
    // Calculate values
    const siteTitle = product ? `${PRODUCT_CONFIGS[product].title}` : "Mirascope";
    const pageTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    const metaDescription =
      description || (product ? PRODUCT_CONFIGS[product].description : DEFAULT_DESCRIPTION);

    // Get the current base URL from the browser
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    // Normalize image path
    const ogImage = image || DEFAULT_IMAGE;

    // Create URLs with proper joining
    const ogUrl = url
      ? new URL(url.startsWith("/") ? url : `/${url}`, baseUrl).toString()
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
  }, [title, description, image, url, type, product, article]);
}

export default useSEO;
