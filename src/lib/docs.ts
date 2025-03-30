// Define the DocMeta type for documentation files
export type DocMeta = {
  title: string;
  description?: string;
  slug: string;
  path: string;
  section: string;
  product: string;
};

// Cache for loaded documentation
let docsCache: Record<string, { content: string; meta: DocMeta }> | null = null;

// Function to parse frontmatter from MDX content
const parseFrontmatter = (
  fileContent: string
): { frontmatter: Record<string, string>; content: string } => {
  // Handle YAML frontmatter with three dashes
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    // If no frontmatter, just extract the first heading as the title
    const titleMatch = fileContent.match(/^# (.*$)/m);
    const title = titleMatch ? titleMatch[1] : "Untitled Document";
    return {
      frontmatter: { title },
      content: fileContent,
    };
  }

  const frontmatterStr = match[1];
  const content = match[2];

  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      let value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1")
        .replace(/^'(.*)'$/, "$1");
        
      // Clean up any trailing comments
      if (value.includes("#")) {
        value = value.split("#")[0].trim();
      }
      
      frontmatter[key] = value;
    }
  }

  console.log("Parsed frontmatter:", frontmatter);
  return { frontmatter, content };
};

// Mock API for accessing documentation files
const docsAPI = {
  /**
   * Get file content for a specific documentation path
   */
  async getDocContent(
    product: string,
    section: string,
    slug: string
  ): Promise<string> {
    try {
      // Try multiple possible paths
      const possiblePaths = [
        `/src/docs/${product}/${section}/${slug}.mdx`,  // Direct path in src
        `/docs/${product}/${section}/${slug}.mdx`,      // Public path
        `/docs/${product}/${section}/${slug}.md`        // Public path with .md extension
      ];
      
      let content = null;
      let error = null;
      
      // Try each path until one works
      for (const path of possiblePaths) {
        try {
          console.log(`[docsAPI] Trying to fetch from: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            content = await response.text();
            console.log(`[docsAPI] Successfully loaded from: ${path}`);
            break;
          }
        } catch (e) {
          error = e;
          console.log(`[docsAPI] Failed to fetch from: ${path}`, e);
        }
      }
      
      if (content) {
        return content;
      }
      
      throw error || new Error(`Error fetching document: No valid path found`);
    } catch (error) {
      console.error(`[docsAPI] Error fetching document:`, error);
      throw error;
    }
  },

  /**
   * Get all documentation files for a specific product and section
   */
  async listDocs(
    product: string,
    section: string
  ): Promise<{ slug: string; title: string }[]> {
    try {
      const path = `/api/docs/${product}/${section}/`;
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Error fetching documents list: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching documents list:`, error);
      throw error;
    }
  },
};

// Get document by product, section, and slug
export const getDoc = async (
  product: string,
  section: string,
  slug: string
): Promise<{ meta: DocMeta; content: string }> => {
  console.log(
    `[Docs] getDoc called with product: ${product}, section: ${section}, slug: ${slug}`
  );

  try {
    // Try to fetch the document content
    let fileContent;
    
    try {
      // Try through the API first
      fileContent = await docsAPI.getDocContent(product, section, slug);
      console.log("[Docs] Successfully loaded content via API");
    } catch (e) {
      console.log("[Docs] API approach failed, using fallback");
      
      // If not available, use hardcoded content based on known files
      if ((product === "mirascope" && section === "main" && slug === "index") ||
          (product === "mirascope" && section === "api" && slug === "index") ||
          (product === "lilypad" && section === "main" && slug === "index") ||
          (product === "lilypad" && section === "api" && slug === "index")) {
        
        try {
          // Directly load from the file system
          const path = `/src/docs/${product}/${section}/${slug}.mdx`;
          console.log(`[Docs] Trying to load from path: ${path}`);
          
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load file from ${path}`);
          }
          
          fileContent = await response.text();
          console.log("[Docs] Successfully loaded from file system");
        } catch (fetchError) {
          console.error("[Docs] Failed to load file:", fetchError);
          // Create placeholder content when all else fails
          fileContent = createPlaceholderContent(product, section, slug);
        }
      } else {
        // File doesn't exist at all, return 404
        throw new Error(`Document ${product}/${section}/${slug} not found`);
      }
    }
    
    // Parse the content
    const { frontmatter, content } = parseFrontmatter(fileContent);
    
    // Extract title from frontmatter or first heading
    let title = frontmatter.title;
    if (!title) {
      const titleMatch = content.match(/^# (.*$)/m);
      title = titleMatch ? titleMatch[1] : "Untitled Document";
    }

    const meta: DocMeta = {
      title,
      description: frontmatter.description || "",
      slug,
      path: `${product}/${section}/${slug}`,
      section,
      product,
    };

    return { meta, content };
  } catch (error) {
    console.error(
      `[Docs] Error loading document ${product}/${section}/${slug}:`,
      error
    );
    throw error;
  }
};

// Helper function to create placeholder content for non-existent files
const createPlaceholderContent = (product: string, section: string, slug: string): string => {
  let title, description;
  
  // Only generate placeholders for files that exist but couldn't be loaded
  if (product === "mirascope") {
    if (section === "main" && slug === "index") {
      title = "Getting Started with Mirascope";
      description = "Learn how to build LLM-powered applications with Mirascope.";
    } else if (section === "api" && slug === "index") {
      title = "Mirascope API Reference";
      description = "Complete API reference for Mirascope.";
    }
  } else if (product === "lilypad") {
    if (section === "main" && slug === "index") {
      title = "Getting Started with Lilypad";
      description = "Learn how to build your data flywheel with Lilypad.";
    } else if (section === "api" && slug === "index") {
      title = "Lilypad API Reference";
      description = "Complete API reference for Lilypad.";
    }
  }
  
  title = title || `${product} Documentation`;
  description = description || `Documentation for ${product}`;
  
  return `---
title: ${title}
description: ${description}
---

# ${title}

${description}

*This content is under development. Please check back soon for updates.*
`;
};

// Get all documentation for a specific product and section
export const getDocsForSection = async (
  product: string,
  section: string
): Promise<DocMeta[]> => {
  console.log(
    `[Docs] getDocsForSection called with product: ${product}, section: ${section}`
  );

  try {
    // First try the API approach
    try {
      const docs = await docsAPI.listDocs(product, section);
      if (docs && docs.length > 0) {
        console.log(`[Docs] Found ${docs.length} docs via API`);
        return docs.map((doc) => ({
          title: doc.title,
          slug: doc.slug,
          path: `${product}/${section}/${doc.slug}`,
          section,
          product,
        }));
      }
    } catch (apiError) {
      console.log("[Docs] API approach failed, using fallback", apiError);
    }
    
    // If API fails, use fallback approach based on the actual files available
    console.log("[Docs] Trying direct file loading fallback");
    return getHardcodedDocsForSection(product, section);
  } catch (error) {
    console.error(`[Docs] Error loading section ${product}/${section}:`, error);
    return getHardcodedDocsForSection(product, section);
  }
};

// Helper function to provide hardcoded docs metadata based on known files
const getHardcodedDocsForSection = (
  product: string,
  section: string
): DocMeta[] => {
  // Based on actual files available in the repo (confirmed with find command)
  if (product === "mirascope") {
    if (section === "main") {
      return [
        {
          title: "Getting Started with Mirascope",
          slug: "index",
          path: `${product}/${section}/index`,
          section,
          product,
        }
      ];
    } else if (section === "api") {
      return [
        {
          title: "API Reference",
          slug: "index",
          path: `${product}/${section}/index`,
          section,
          product,
        }
      ];
    }
  } else if (product === "lilypad") {
    if (section === "main") {
      return [
        {
          title: "Getting Started with Lilypad",
          slug: "index", 
          path: `${product}/${section}/index`,
          section,
          product,
        }
      ];
    } else if (section === "api") {
      return [
        {
          title: "API Reference",
          slug: "index",
          path: `${product}/${section}/index`,
          section,
          product,
        }
      ];
    }
  }
  
  // Default fallback - just the index page
  return [
    {
      title: "Documentation",
      slug: "index",
      path: `${product}/${section}/index`,
      section,
      product,
    }
  ];
};