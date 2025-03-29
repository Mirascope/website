import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate read time based on word count (average reading speed: 200 words/minute)
function calculateReadTime(content) {
  const words = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// Extract title from content if not in frontmatter
function extractTitle(content) {
  const titleMatch = content.match(/^# (.+)$/m);
  return titleMatch ? titleMatch[1] : 'Untitled Post';
}

// Function to parse multi-line descriptions and author arrays
function parseFrontmatter(frontmatterStr) {
  const frontmatter = {};
  let currentKey = null;
  let multilineValue = null;
  let inMultiline = false;
  
  // Split the frontmatter into lines and process each line
  const lines = frontmatterStr.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    if (!inMultiline) {
      // Check if this is a new key-value pair
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      
      if (keyMatch) {
        currentKey = keyMatch[1];
        const value = keyMatch[2].trim();
        
        // Check if this starts a multi-line value (like description: >)
        if (value === '>' || value === '|') {
          inMultiline = true;
          multilineValue = '';
        } else if (value.startsWith('-')) {
          // This is an array value (like authors)
          frontmatter[currentKey] = [value.substring(1).trim()];
          
          // Check subsequent lines for more array items
          let nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
          while (nextLine.startsWith('-')) {
            frontmatter[currentKey].push(nextLine.substring(1).trim());
            i++;
            nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
          }
        } else {
          // Regular single-line value
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            frontmatter[currentKey] = value.slice(1, -1);
          } else {
            frontmatter[currentKey] = value;
          }
        }
      }
    } else {
      // We're inside a multi-line value
      // Check if this line is indented (part of the multi-line value)
      if (line.startsWith('  ') || !line.includes(':')) {
        const valueLine = line.replace(/^  /, '');
        multilineValue += (multilineValue ? ' ' : '') + valueLine;
      } else {
        // This line is not indented, so we're done with the multi-line value
        frontmatter[currentKey] = multilineValue;
        inMultiline = false;
        
        // Process this line as a new key-value pair
        i--; // Reprocess this line
      }
    }
  }
  
  // Make sure we capture the last multi-line value if there is one
  if (inMultiline && multilineValue !== null) {
    frontmatter[currentKey] = multilineValue;
  }
  
  // Handle author field
  if (frontmatter.authors) {
    if (Array.isArray(frontmatter.authors) && frontmatter.authors.length > 0) {
      const firstAuthor = frontmatter.authors[0];
      frontmatter.author = firstAuthor === 'willbakst' ? 'William Bakst' : firstAuthor;
    } else if (typeof frontmatter.authors === 'string') {
      frontmatter.author = frontmatter.authors === 'willbakst' ? 'William Bakst' : frontmatter.authors;
    }
  }
  
  return frontmatter;
}

// Function to normalize text by replacing typographic quotes with standard ones
function normalizeText(text) {
  return text
    .replace(/[""]/g, '"')       // Replace curly quotes with straight quotes
    .replace(/['']/g, "'")       // Replace curly apostrophes with straight apostrophes
    .replace(/'/g, "'")          // Replace another type of apostrophe
    .replace(/…/g, '...')        // Replace ellipsis with three dots
    .replace(/–/g, '-')          // Replace en dash with hyphen
    .replace(/—/g, '-');         // Replace em dash with hyphen
    // No longer normalize whitespace to preserve original formatting
}

// Convert a Markdown file to MDX format
async function convertToMdx(sourcePath, destPath, slug) {
  try {
    // Read the source file
    const content = await fs.readFile(sourcePath, 'utf8');

    // Check if there's frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      console.error(`No frontmatter found in ${sourcePath}`);
      return;
    }

    const frontmatterStr = frontmatterMatch[1];
    const mainContent = frontmatterMatch[2];
    
    // Parse frontmatter with better handling of multi-line values
    const frontmatter = parseFrontmatter(frontmatterStr);
    
    // Prepare the new frontmatter
    const title = frontmatter.title ? normalizeText(frontmatter.title) : extractTitle(mainContent);
    const description = frontmatter.description ? normalizeText(frontmatter.description) : '';
    
    // Convert date to ISO format if needed
    let date = frontmatter.date || new Date().toISOString().split('T')[0];
    if (date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
      // Ensure format is YYYY-MM-DD
      const [year, month, day] = date.split('-');
      date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const readTime = calculateReadTime(mainContent);
    
    // Handle author extraction
    // For blog posts, set William Bakst as the default author
    let author = 'William Bakst'; 
    
    // Debug: Print out the frontmatter for debugging
    console.log(`Processing file: ${sourcePath}`);
    
    if (Array.isArray(frontmatter.authors) && frontmatter.authors.length > 0) {
      // If author is willbakst, map to William Bakst
      if (frontmatter.authors[0] === 'willbakst') {
        author = 'William Bakst';
      } else {
        author = frontmatter.authors[0];
      }
    } else if (frontmatter.author) {
      author = frontmatter.author === 'willbakst' ? 'William Bakst' : frontmatter.author;
    }
    
    // Process main content
    // Remove the "<!-- more -->" tag used in some blogging platforms
    let processedContent = mainContent.replace(/<!-- more -->/g, '');
    
    // Normalize quotes and other typographic characters in content
    processedContent = normalizeText(processedContent);
    
    // Convert code block highlighting syntax
    // Find code blocks and process them
    processedContent = processedContent.replace(/```([\w-]*)\s+hl_lines="([^"]*)"/g, (match, lang, hlLines) => {
      // Convert hl_lines syntax to {1 2-3} syntax
      return '```' + lang + ' {' + hlLines + '}';
    });
    
    // Make sure there is an empty line before headers if there isn't one already
    processedContent = processedContent.replace(/([^\n])\n(#+\s+)/g, '$1\n\n$2');
    
    // Make sure there is an empty line after headers if there isn't one already
    processedContent = processedContent.replace(/(#+\s+.*)\n([^#\n])/g, '$1\n\n$2');
    
    // Remove 3+ consecutive newlines, preserving exactly 2
    processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
    
    // Create the new MDX content
    const mdxContent = `---
title: "${title}"
description: "${description}"
date: "${date}"
readTime: "${readTime}"
author: "${author}"
---

${processedContent}`;

    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });

    // Write the new MDX file
    await fs.writeFile(destPath, mdxContent);
    console.log(`Converted ${sourcePath} to ${destPath}`);
  } catch (error) {
    console.error(`Error converting ${sourcePath}:`, error);
  }
}

async function migrateAllPosts() {
  const sourceDir = path.join(__dirname, 'docs', 'blog', 'posts');
  const destDir = path.join(__dirname, 'src', 'posts');
  
  try {
    // Get all .md files
    const files = await fs.readdir(sourceDir);
    const mdFiles = files.filter(file => file.endsWith('.md') && !file.endsWith('.html.md'));
    
    // Create destination directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true });
    
    // Convert each file
    for (const file of mdFiles) {
      const sourcePath = path.join(sourceDir, file);
      
      // Read file to extract slug from frontmatter
      const content = await fs.readFile(sourcePath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      
      let slug = path.basename(file, '.md');
      
      // If frontmatter has a slug, use it; otherwise use filename
      if (frontmatterMatch) {
        const frontmatter = parseFrontmatter(frontmatterMatch[1]);
        if (frontmatter.slug) {
          slug = frontmatter.slug;
        }
      }
      
      const destPath = path.join(destDir, `${slug}.mdx`);
      await convertToMdx(sourcePath, destPath, slug);
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateAllPosts();