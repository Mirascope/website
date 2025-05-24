interface ParsedContentSection {
  title: string;
  description?: string;
  url?: string;
  content: string;
}

interface ParsedContent {
  header: string;
  sections: ParsedContentSection[];
}

export function parseContentSections(content: string): ParsedContent {
  // Split by ContentSection markers
  const parts = content.split(/<ContentSection[^>]*>/);

  // The first part is the header (before any ContentSection)
  const header = parts[0].trim();

  // Process each section
  const sections: ParsedContentSection[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    // Find the closing tag
    const closingTagIndex = part.indexOf("</ContentSection>");
    if (closingTagIndex === -1) continue;

    // Extract the content between opening and closing tags
    const sectionContent = part.substring(0, closingTagIndex).trim();

    // Extract attributes from the opening tag in the original content
    // Find the opening tag that corresponds to this section
    const beforeSection = content.substring(0, content.indexOf(part));
    const openingTagMatch = beforeSection.match(/<ContentSection[^>]*>$/);

    if (openingTagMatch) {
      const openingTag = openingTagMatch[0];

      // Extract attributes
      const titleMatch = openingTag.match(/title="([^"]*)"/);
      const descriptionMatch = openingTag.match(/description="([^"]*)"/);
      const urlMatch = openingTag.match(/url="([^"]*)"/);

      sections.push({
        title: titleMatch ? titleMatch[1] : `Section ${i}`,
        description: descriptionMatch ? descriptionMatch[1] : undefined,
        url: urlMatch ? urlMatch[1] : undefined,
        content: sectionContent,
      });
    }
  }

  return { header, sections };
}
