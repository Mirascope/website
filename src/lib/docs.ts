// Import the centralized meta file
import docsMetadata from "../docs/_meta";
import type { 
  DocMetaItem, 
  DocGroup, 
  DocSection, 
  ProductDocs 
} from "../docs/_meta";

// Types for documentation handling
export type DocType = "item" | "group-item" | "section-item" | "section-group-item";

// Document metadata
export type DocMeta = {
  title: string;
  description?: string;
  slug: string;
  path: string;
  product: string;
  type: DocType;
  
  // Optional group/section information
  group?: string;
  section?: string;
  groupTitle?: string;
  sectionTitle?: string;
};

// Document with content
export type DocWithContent = {
  meta: DocMeta;
  content: string;
};

// Cache for loaded documentation content
let contentCache: Record<string, string> = {};

// Function to parse frontmatter from MDX content
const parseFrontmatter = (
  fileContent: string
): { frontmatter: Record<string, any>; content: string } => {
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
  const frontmatter: Record<string, any> = {};
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
      
      // Convert boolean strings to actual boolean values
      if (value === "true") {
        frontmatter[key] = true;
      } else if (value === "false") {
        frontmatter[key] = false;
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, content };
};

// Get document by product, type, and path components
export const getDoc = async (
  product: string,
  params: {
    section?: string;
    group?: string;
    slug: string;
  }
): Promise<DocWithContent> => {
  const { section, group, slug } = params;
  
  console.log(
    `[Docs] getDoc called with product: ${product}, ` +
    `section: ${section || "none"}, ` +
    `group: ${group || "none"}, ` +
    `slug: ${slug === "" ? "(empty)" : slug}`
  );

  try {
    // Determine the file path based on the type
    let filePath = '';
    let isWelcome = false;
    
    console.log(`[Docs] getDoc determining path for: product=${product}, section=${section}, group=${group}, slug=${slug || "(empty)"}`);
    
    if (section && group) {
      // Section + group - like API > LLM > Generation
      
      // Verify this is a valid section first
      const sectionExists = docsMetadata[product]?.sections?.[section];
      if (!sectionExists) {
        console.error(`[Docs] Section '${section}' not found in product ${product}`);
      }
      
      // Verify the group exists in this section
      const groupExists = docsMetadata[product]?.sections?.[section]?.groups?.[group];
      if (!groupExists) {
        console.error(`[Docs] Group '${group}' not found in section '${section}'`);
      }
      
      // Check for index or empty slug for section+group
      if (slug === "" || slug === undefined || slug === "index" || slug === "overview") {
        console.log(`[Docs] Loading section+group index file: ${product}/${section}/${group}/index.mdx`);
        filePath = `${product}/${section}/${group}/index.mdx`;
      } else {
        // Regular section+group item
        filePath = `${product}/${section}/${group}/${slug}.mdx`;
        console.log(`[Docs] Using section+group path: ${filePath}`);
      }
      
      // Verify this exists in the metadata
      const itemExists = 
        slug === "index" || slug === "" || slug === "overview"
          ? true // Assume index always exists metadata-wise
          : docsMetadata[product]?.sections?.[section]?.groups?.[group]?.items?.[slug];
      
      console.log(`[Docs] Section group item exists in metadata: ${!!itemExists}`);
      
      // Double check the file path is correct
      console.log(`[Docs] Checking for file at path: ${filePath}`);
    } else if (section) {
      // Verify this is a valid section or top-level item
      const sectionExists = docsMetadata[product]?.sections?.[section];
      const isTopLevelItem = docsMetadata[product]?.items?.[section];
      
      if (!sectionExists && !isTopLevelItem) {
        console.error(`[Docs] Section '${section}' not found in product ${product} and is not a top-level item`);
        
        // Check if this is actually a top-level group that was misinterpreted as a section
        const isTopLevelGroup = docsMetadata[product]?.groups?.[section];
        if (isTopLevelGroup) {
          console.log(`[Docs] '${section}' is actually a top-level group, not a section. Adjusting path.`);
          
          // Treat this as a group item path
          if (slug === "" || slug === undefined || slug === "index" || slug === "overview") {
            filePath = `${product}/${section}/index.mdx`;
          } else {
            filePath = `${product}/${section}/${slug}.mdx`;
          }
        }
      } 
      // It's a valid section or top-level item, proceed normally
      else if (isTopLevelItem) {
        // This is a top-level item, not a section
        filePath = `${product}/${section}.mdx`;
        console.log(`[Docs] This is a top-level item, not a section. Using path: ${filePath}`);
      }
      else {
        // For empty slug at section level, we always load the index.mdx file
        if (slug === "" || slug === undefined) {
          console.log(`[Docs] Loading section index file: ${product}/${section}/index.mdx`);
          filePath = `${product}/${section}/index.mdx`;
        } 
        // For explicit "index" or "overview" slug
        else if (slug === "index" || slug === "overview") {
          console.log(`[Docs] Loading section index file for slug '${slug}': ${product}/${section}/index.mdx`);
          filePath = `${product}/${section}/index.mdx`;
        } 
        // Regular section item
        else {
          filePath = `${product}/${section}/${slug}.mdx`;
          console.log(`[Docs] Using section path: ${filePath}`);
          
          // Verify this item exists in the section
          const itemExists = docsMetadata[product]?.sections?.[section]?.items?.[slug];
          if (!itemExists) {
            console.error(`[Docs] Item '${slug}' not found in section '${section}'`);
          }
        }
      }
    } else if (group) {
      // Verify this is a valid group 
      const groupExists = docsMetadata[product]?.groups?.[group];
      if (!groupExists) {
        console.error(`[Docs] Group '${group}' not found in product ${product}`);
      }
      
      // Check for index or empty slug
      if (slug === "" || slug === undefined || slug === "index" || slug === "overview") {
        // Handle group index page - first try the index file
        console.log(`[Docs] Loading group index file: ${product}/${group}/index.mdx`);
        filePath = `${product}/${group}/index.mdx`;
        
        // Also prepare fallback to first item if no index exists
        const groupItems = docsMetadata[product]?.groups?.[group]?.items || {};
        const itemSlugs = Object.keys(groupItems);
        
        if (itemSlugs.length > 0) {
          console.log(`[Docs] Found ${itemSlugs.length} items in group, will use first item as fallback if needed`);
        } else {
          console.log(`[Docs] No items found in group ${group}`);
        }
      } else {
        // Regular group item
        filePath = `${product}/${group}/${slug}.mdx`;
        console.log(`[Docs] Using group path: ${filePath}`);
        
        // Verify this item exists in the group
        const itemExists = docsMetadata[product]?.groups?.[group]?.items?.[slug];
        if (!itemExists) {
          console.error(`[Docs] Item '${slug}' not found in group '${group}'`);
        }
      }
    } else {
      // Top-level page - like Migration Guide
      if (slug === "welcome") {
        isWelcome = true;
        filePath = `${product}/index.mdx`; // Special case for welcome page
        console.log(`[Docs] Using welcome path: ${filePath}`);
      } else {
        filePath = `${product}/${slug}.mdx`;
        console.log(`[Docs] Using top-level path: ${filePath}`);
        
        // Double-check that this file actually exists in metadata
        const productData = docsMetadata[product];
        const itemExists = productData?.items && productData.items[slug];
        console.log(`[Docs] Item '${slug}' ${itemExists ? 'exists' : 'does NOT exist'} in metadata`);
      }
    }
    
    console.log(`[Docs] Final file path: ${filePath}`);
    
    // Get the content from cache or fetch
    let content = contentCache[filePath];
    if (!content) {
      try {
        // Check if this is a section group path and provide detailed logs
        if (section && group) {
          console.log(`[Docs] Section group fetch: product=${product}, section=${section}, group=${group}, slug=${slug}`);
          console.log(`[Docs] Full path to fetch: /src/docs/${filePath}`);
        } else {
          console.log(`[Docs] Fetching content from: /src/docs/${filePath}`);
        }
        
        const response = await fetch(`/src/docs/${filePath}`);
        
        if (!response.ok) {
          console.error(`[Docs] Fetch failed with status ${response.status}: ${response.statusText}`);
          
          if (section && group) {
            console.error(`[Docs] Failed to load section group document: ${product}/${section}/${group}/${slug}`);
            console.error(`[Docs] This could be due to:
            1. The file doesn't exist at src/docs/${filePath}
            2. The route is correct but the file is missing
            3. The file exists but has permission issues`);
          }
          
          throw new Error(`Error fetching doc content: ${response.statusText}`);
        }
        
        content = await response.text();
        console.log(`[Docs] Content loaded successfully, length: ${content.length} characters`);
        contentCache[filePath] = content;
      } catch (error) {
        console.error(`[Docs] Error fetching doc content for ${filePath}:`, error);
        
        // Special error handling for section group documents
        if (section && group) {
          console.error(`[Docs] Details for section group fetch:
          - Product: ${product}
          - Section: ${section}
          - Group: ${group}
          - Slug: ${slug}
          - Expected file: ${filePath}`);
        }
        
        // For section+group, try to be more specific with error messaging
        if (section && group) {
          // Try to get the document metadata first
          let title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
          
          // Check if this is actually defined in metadata
          const groupData = docsMetadata[product]?.sections?.[section]?.groups?.[group];
          const itemData = groupData?.items?.[slug];
          
          if (itemData) {
            title = itemData.title;
            console.log(`[Docs] Found item in metadata: ${title}`);
          } else {
            console.log(`[Docs] Item ${slug} not found in metadata for ${section}/${group}`);
          }
          
          // For section+group index pages, generate a special index page
          if (slug === "index" || slug === "" || slug === "overview") {
            const groupData = docsMetadata[product]?.sections?.[section]?.groups?.[group];
            const groupItems = groupData?.items || {};
            const groupTitle = groupData?.title || group;
            const groupDesc = groupData?.description || "";
            
            console.log(`[Docs] Creating auto-generated index page for ${section}/${group}`);
            
            // Create a nice index page showing all the items in this group
            content = `---
title: ${groupTitle}
description: ${groupDesc}
---

# ${groupTitle}

${groupDesc}

## Available Documentation

${Object.entries(groupItems)
  .map(([itemSlug, item]) => `- [${item.title}](/docs/${product}/${section}/${group}/${itemSlug})`)
  .join('\n')}
`;
          }
          // Standard section+group item
          else {
            // Create detailed error message about the missing content
            content = `---
title: ${title}
description: Document Not Found
---

# ${title}

This document could not be found. Please check that you have created the file:

\`/src/docs/${filePath}\`

Make sure you've also defined it in the metadata at:

\`/src/docs/_meta.ts\` under \`${product}.sections.${section}.groups.${group}.items.${slug}\`

## Debug Info
- Product: ${product}
- Section: ${section}
- Group: ${group}
- Slug: ${slug}
- Expected file path: ${filePath}
`;
          }
          console.log(`[Docs] Created detailed error content for ${filePath}`);
        } else if (group && !section) {
          // Special handling for group-only items
          console.log(`[Docs] Creating placeholder content for group item: ${product}/${group}/${slug}`);
          
          // Get group data
          const groupData = docsMetadata[product]?.groups?.[group];
          
          if (groupData) {
            // For group index pages, auto-generate an index
            if (slug === "index" || slug === "" || slug === "overview") {
              const groupItems = groupData.items || {};
              const groupTitle = groupData.title || group;
              const groupDesc = groupData.description || "";
              
              console.log(`[Docs] Creating auto-generated index page for group ${group}`);
              
              // Create a nice index page showing all the items in this group
              content = `---
title: ${groupTitle}
description: ${groupDesc}
---

# ${groupTitle}

${groupDesc}

## Available Documentation

${Object.entries(groupItems)
  .map(([itemSlug, item]) => `- [${item.title}](/docs/${product}/${group}/${itemSlug})`)
  .join('\n')}
`;
            } else {
              // For regular group items, try to get title from metadata
              const itemData = groupData.items?.[slug];
              const title = itemData?.title || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
              
              // Create a placeholder for the group item
              content = `---
title: ${title}
description: ${itemData?.description || `Documentation for ${title}`}
---

# ${title}

*This content is under development. Please check back soon for updates.*
`;
            }
          } else {
            // Group not found in metadata
            console.log(`[Docs] Creating placeholder content for ${filePath}`);
            content = createPlaceholderContent(product, { section, group, slug });
          }
        } else {
          // Create regular placeholder content for other cases
          console.log(`[Docs] Creating placeholder content for ${filePath}`);
          content = createPlaceholderContent(product, { section, group, slug });
        }
      }
    } else {
      console.log(`[Docs] Using cached content for ${filePath}`);
    }
    
    // Parse frontmatter
    const { frontmatter } = parseFrontmatter(content);
    
    // Get metadata from structure
    const meta = getMetadataFromStructure(product, { section, group, slug: isWelcome ? "welcome" : slug });
    
    // Override with frontmatter if specified
    if (frontmatter.title) {
      meta.title = frontmatter.title;
    }
    
    if (frontmatter.description) {
      meta.description = frontmatter.description;
    }
    
    return { meta, content };
  } catch (error) {
    console.error(
      `[Docs] Error loading document for ${product} / ${section} / ${group} / ${slug}:`,
      error
    );
    
    // Create placeholder with metadata
    const meta = getMetadataFromStructure(product, { section, group, slug });
    const content = createPlaceholderContent(product, { section, group, slug });
    
    return { meta, content };
  }
};

// Helper function to get metadata from the structure
const getMetadataFromStructure = (
  product: string,
  params: {
    section?: string;
    group?: string;
    slug: string;
  }
): DocMeta => {
  const { section, group, slug } = params;
  const productDocs = docsMetadata[product] as ProductDocs;
  
  if (!productDocs) {
    // Product not found, return minimal metadata
    return {
      title: product.charAt(0).toUpperCase() + product.slice(1),
      description: `Documentation for ${product}`,
      slug,
      path: buildPath(product, { section, group, slug }),
      product,
      type: "item",
    };
  }
  
  // Determine the title and description based on type
  let title = "";
  let description = "";
  let docType: DocType = "item";
  let sectionTitle = "";
  let groupTitle = "";
  
  if (section && group && slug) {
    // Section + group + slug - E.g., API > LLM > Generation
    docType = "section-group-item";
    
    // First check if "section" is actually a top-level group
    if (productDocs.groups && productDocs.groups[section]) {
      // This is a top-level group being mistakenly treated as a section
      console.log(`"${section}" is actually a top-level group, not a section`);
      
      const groupData = productDocs.groups[section];
      groupTitle = groupData.title;
      
      if (group === section) {
        // We're handling a top-level group item
        const item = groupData.items[slug];
        if (item) {
          title = item.title;
          description = item.description || "";
        }
      } else {
        console.error(`Group mismatch: section=${section}, group=${group}`);
      }
    } else {
      // Regular section+group handling
      const sectionData = productDocs.sections[section];
      if (sectionData) {
        sectionTitle = sectionData.title;
        
        console.log(`Looking for group '${group}' in section '${section}'`);
        console.log(`Available groups in this section:`, Object.keys(sectionData.groups || {}));
        
        const groupData = sectionData.groups?.[group];
        if (groupData) {
          groupTitle = groupData.title;
          
          console.log(`Looking for slug '${slug}' in group '${group}'`);
          console.log(`Available items in this group:`, Object.keys(groupData.items));
          
          const item = groupData.items[slug];
          if (item) {
            title = item.title;
            description = item.description || "";
          }
        } else {
          console.error(`Group '${group}' not found in section '${section}'`);
        }
      } else {
        console.error(`Section '${section}' not found in product '${product}'`);
      }
    }
  } else if (section && slug) {
    // Section + slug - E.g., API > Overview
    
    // Check if this "section" is actually a top-level group
    if (productDocs.groups && productDocs.groups[section]) {
      // This is a top-level group being mistakenly treated as a section
      console.log(`In section+slug: "${section}" is actually a top-level group, not a section`);
      
      // Treat this as a group item instead
      docType = "group-item";
      const groupData = productDocs.groups[section];
      groupTitle = groupData.title;
      
      const item = groupData.items[slug];
      if (item) {
        title = item.title;
        description = item.description || "";
      }
    } else {
      // Regular section handling
      docType = "section-item";
      const sectionData = productDocs.sections[section];
      if (sectionData) {
        sectionTitle = sectionData.title;
        
        const item = sectionData.items[slug];
        if (item) {
          title = item.title;
          description = item.description || "";
        }
      } else {
        console.error(`In section+slug: Section '${section}' not found in product '${product}'`);
      }
    }
  } else if (group && slug) {
    // Group + slug - E.g., Getting Started > Quickstart
    docType = "group-item";
    
    const groupData = productDocs.groups[group];
    if (groupData) {
      groupTitle = groupData.title;
      
      const item = groupData.items[slug];
      if (item) {
        title = item.title;
        description = item.description || "";
      }
    }
  } else {
    // Just slug - E.g., Migration Guide
    docType = "item";
    
    const item = productDocs.items[slug];
    if (item) {
      title = item.title;
      description = item.description || "";
    }
  }
  
  // If title is still empty, generate one from the slug
  if (!title) {
    title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  }
  
  return {
    title,
    description,
    slug,
    path: buildPath(product, { section, group, slug }),
    product,
    type: docType,
    section,
    group,
    sectionTitle,
    groupTitle,
  };
};

// Helper function to build a path based on components
const buildPath = (
  product: string,
  params: {
    section?: string;
    group?: string;
    slug: string;
  }
): string => {
  const { section, group, slug } = params;
  
  if (section && group) {
    return `${product}/${section}/${group}/${slug}`;
  } else if (section) {
    return `${product}/${section}/${slug}`;
  } else if (group) {
    return `${product}/${group}/${slug}`;
  } else {
    return `${product}/${slug}`;
  }
};

// Helper function to create placeholder content
const createPlaceholderContent = (
  product: string,
  params: {
    section?: string;
    group?: string;
    slug: string;
  }
): string => {
  const meta = getMetadataFromStructure(product, params);
  
  return `---
title: ${meta.title}
description: ${meta.description || `Documentation for ${meta.title}`}
---

# ${meta.title}

*This content is under development. Please check back soon for updates.*
`;
};

// Get all documentation for a product
export const getDocsForProduct = (product: string): DocMeta[] => {
  const productDocs = docsMetadata[product] as ProductDocs;
  if (!productDocs) {
    return [];
  }
  
  const docs: DocMeta[] = [];
  
  // Process top-level items
  Object.keys(productDocs.items).forEach(slug => {
    const item = productDocs.items[slug];
    docs.push({
      title: item.title,
      description: item.description,
      slug,
      path: buildPath(product, { slug }),
      product,
      type: "item"
    });
  });
  
  // Process groups and their items
  Object.keys(productDocs.groups).forEach(groupSlug => {
    const group = productDocs.groups[groupSlug];
    
    // Add each item in the group
    Object.keys(group.items).forEach(itemSlug => {
      const item = group.items[itemSlug];
      docs.push({
        title: item.title,
        description: item.description,
        slug: itemSlug,
        path: buildPath(product, { group: groupSlug, slug: itemSlug }),
        product,
        type: "group-item",
        group: groupSlug,
        groupTitle: group.title
      });
    });
  });
  
  // Process sections
  Object.keys(productDocs.sections).forEach(sectionSlug => {
    const section = productDocs.sections[sectionSlug];
    
    // Add section items
    Object.keys(section.items).forEach(itemSlug => {
      const item = section.items[itemSlug];
      docs.push({
        title: item.title,
        description: item.description,
        slug: itemSlug,
        path: buildPath(product, { section: sectionSlug, slug: itemSlug }),
        product,
        type: "section-item",
        section: sectionSlug,
        sectionTitle: section.title
      });
    });
    
    // Add section groups and their items
    if (section.groups) {
      Object.keys(section.groups).forEach(groupSlug => {
        const group = section.groups![groupSlug];
        
        // Add each item in the group
        Object.keys(group.items).forEach(itemSlug => {
          const item = group.items[itemSlug];
          docs.push({
            title: item.title,
            description: item.description,
            slug: itemSlug,
            path: buildPath(product, { 
              section: sectionSlug, 
              group: groupSlug, 
              slug: itemSlug 
            }),
            product,
            type: "section-group-item",
            section: sectionSlug,
            sectionTitle: section.title,
            group: groupSlug,
            groupTitle: group.title
          });
        });
      });
    }
  });
  
  return docs;
};

// Get all docs for a product section
export const getDocsForSection = (
  product: string,
  section: string
): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter(doc => doc.section === section);
};

// Get all docs for a product group
export const getDocsForGroup = (
  product: string,
  group: string
): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter(doc => doc.group === group);
};

// Gets all available sections for a product
export const getSectionsForProduct = (
  product: string
): { slug: string; title: string }[] => {
  const productDocs = docsMetadata[product] as ProductDocs;
  if (!productDocs || !productDocs.sections) {
    return [];
  }
  
  return Object.keys(productDocs.sections).map(sectionSlug => ({
    slug: sectionSlug,
    title: productDocs.sections[sectionSlug].title
  }));
};