/**
 * Middleware for serving content files in development mode
 * This aligns with the preprocess-content.ts build pipeline
 */
import fs from "fs";
import path from "path";
import { Connect } from "vite";
import { parseFrontmatter } from "../src/lib/content/frontmatter";
import type { BlogMeta } from "../src/lib/content/blog";

// Source and destination directory configuration
export interface ContentDirectories {
  sourceDir: string;
  urlPrefix: string;
  extension: string;
}

// Configuration for all content types
export const contentConfig: Record<string, ContentDirectories> = {
  blog: {
    sourceDir: path.join(process.cwd(), "content", "blog"),
    urlPrefix: "/content/blog/",
    extension: ".mdx",
  },
  doc: {
    sourceDir: path.join(process.cwd(), "content", "doc"),
    urlPrefix: "/content/doc/",
    extension: ".mdx",
  },
  policy: {
    sourceDir: path.join(process.cwd(), "content", "policy"),
    urlPrefix: "/content/policy/",
    extension: ".mdx",
  },
  dev: {
    sourceDir: path.join(process.cwd(), "src", "components", "dev"),
    urlPrefix: "/src/components/dev/",
    extension: ".mdx",
  },
};

/**
 * Create a middleware handler for serving content files
 */
export function createContentMiddleware(contentType: string): Connect.NextHandleFunction {
  const { sourceDir, urlPrefix, extension } = contentConfig[contentType];

  return (req, res, next) => {
    // Skip if not a content file with the right extension
    if (!req.url?.startsWith(urlPrefix) || !req.url.endsWith(extension)) {
      return next();
    }

    try {
      // Extract relative path from the URL
      const urlPath = req.url;
      const relativePath = urlPath.replace(urlPrefix, "");
      const filePath = path.join(sourceDir, relativePath);

      if (!fs.existsSync(filePath)) {
        console.error(`Content file not found: ${filePath}`);
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `${contentType} file not found` }));
      }

      const content = fs.readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/plain");
      res.end(content);
    } catch (error) {
      console.error(`Error serving ${contentType} file:`, error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: `Failed to serve ${contentType} content` }));
    }
  };
}

/**
 * Create a middleware handler for the blog posts list
 */
export function createBlogListMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.url !== "/api/posts-list") {
      return next();
    }

    try {
      const { sourceDir } = contentConfig.blog;
      const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".mdx"));

      // Convert files to BlogMeta objects
      const postsList: BlogMeta[] = [];

      for (const filename of files) {
        const slug = filename.replace(/\.mdx$/, "");
        const filePath = path.join(sourceDir, filename);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        // Extract frontmatter using the shared utility
        const { frontmatter } = parseFrontmatter(fileContent);

        const postMeta: BlogMeta = {
          title: frontmatter.title || slug.replace(/-/g, " "),
          description: frontmatter.description || "",
          date: frontmatter.date || new Date().toISOString().split("T")[0],
          readTime: frontmatter.readTime || "3 min",
          author: frontmatter.author || "Mirascope Team",
          slug,
          path: `blog/${slug}`,
          type: "blog",
          lastUpdated: frontmatter.lastUpdated || frontmatter.date || "",
        };

        postsList.push(postMeta);
      }

      // Sort posts by date in descending order
      postsList.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(postsList));
    } catch (error) {
      console.error("Error listing posts:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Failed to list posts" }));
    }
  };
}

/**
 * Create a middleware plugin that registers all content handlers
 */
export function contentMiddlewarePlugin() {
  return {
    name: "content-middleware-plugin",
    configureServer(server: any) {
      // Register handlers for each content type
      server.middlewares.use(createBlogListMiddleware());
      server.middlewares.use(createContentMiddleware("blog"));
      server.middlewares.use(createContentMiddleware("doc"));
      server.middlewares.use(createContentMiddleware("policy"));
      server.middlewares.use(createContentMiddleware("dev"));
    },
  };
}
