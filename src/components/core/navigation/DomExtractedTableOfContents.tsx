import React, { useEffect, useState } from "react";
import { TableOfContents, type TOCItem } from "./TableOfContents";

type DomExtractedTableOfContentsProps = {
  contentId: string;
  path: string;
};

/**
 * Legacy table of contents component that extracts headings from the DOM.
 * Uses the new props-based TableOfContents component for rendering.
 */
const DomExtractedTableOfContents: React.FC<DomExtractedTableOfContentsProps> = ({
  contentId,
  path,
}) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // First effect: Heading extraction
  useEffect(() => {
    // Helper function to extract headings
    const extractHeadings = () => {
      const contentElement = document.getElementById(contentId);
      if (!contentElement) {
        console.log(`TableOfContents: Content element with ID "${contentId}" not found`);
        return;
      }

      // Find all heading elements with IDs
      const headingElements = Array.from(
        contentElement.querySelectorAll("h1, h2, h3, h4, h5, h6")
      ).filter((el) => el.id); // Only include headings with IDs

      if (headingElements.length === 0) {
        console.log(`TableOfContents: No headings with IDs found in element "${contentId}"`);
        return;
      }

      // Create TOCItems from the heading elements
      const items: TOCItem[] = headingElements.map((heading) => ({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1)), // Get the heading level (1-6)
      }));

      // Only update state if we have new headings that are different from current ones
      if (items.length > 0 && JSON.stringify(items) !== JSON.stringify(headings)) {
        setHeadings(items);
      }
    };

    // Initial extraction after a brief delay to ensure content is rendered
    const initialTimer = setTimeout(extractHeadings, 300);

    // Add a mutation observer to detect when heading IDs might be added dynamically
    const observer = new MutationObserver((mutations) => {
      // Check if any mutations involve element attributes (like adding an ID)
      const shouldExtract = mutations.some(
        (mutation) => mutation.type === "attributes" || mutation.type === "childList"
      );

      if (shouldExtract) {
        setTimeout(extractHeadings, 100);
      }
    });

    const contentElement = document.getElementById(contentId);
    if (contentElement) {
      observer.observe(contentElement, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    // Clean up timers and observers
    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [contentId, path, headings]);

  // Second effect: Set up observer for active heading tracking
  useEffect(() => {
    if (headings.length === 0) return;

    const contentElement = document.getElementById(contentId);
    if (!contentElement) return;

    // Set up intersection observer for tracking active heading
    const observerOptions = {
      rootMargin: "-100px 0px -70% 0px",
      threshold: 0,
    };

    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all heading elements
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean);

    elements.forEach((el) => {
      if (el) headingObserver.observe(el);
    });

    return () => {
      headingObserver.disconnect();
    };
  }, [headings, contentId]);

  // Use the new TableOfContents component to render
  return <TableOfContents headings={headings} activeId={activeId} />;
};

export default DomExtractedTableOfContents;
