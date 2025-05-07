import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import { ChevronLeft, Clipboard, Check } from "lucide-react";
import { MDXRenderer } from "@/src/components/mdx/providers";

import { LoadingContent } from "@/src/components/core/feedback";
import { TableOfContents } from "@/src/components/core/navigation";
import { SEOMeta } from "@/src/components/core/meta";
import { PagefindMeta } from "@/src/components/core/meta";
import analyticsManager from "@/src/lib/services/analytics";
import type { BlogContent } from "@/src/lib/content";
import { AppLayout } from "@/src/components/core/layout";

// Reusable component for "Back to Blog" button
function BackToBlogLink() {
  return (
    <div className="flex justify-end">
      <ButtonLink href="/blog" variant="outline" size="sm">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Blog
      </ButtonLink>
    </div>
  );
}

type BlogPostPageProps = {
  post: BlogContent;
  slug: string;
  isLoading?: boolean;
};

export function BlogPostPage({ post, slug, isLoading = false }: BlogPostPageProps) {
  const [ogImage, setOgImage] = useState<string | undefined>(undefined);
  const [isCopied, setIsCopied] = useState(false);

  // Copy post content as Markdown
  const copyContentAsMarkdown = () => {
    if (post.content) {
      navigator.clipboard
        .writeText(post.content)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);

          const pagePath = window.location.pathname;

          // Using GA4 standard "select_content" event with recommended parameters
          analyticsManager.trackEvent("select_content", {
            content_type: "blog_markdown",
            item_id: slug,
            product: "blog",
            page_path: pagePath,
          });
        })
        .catch((err) => {
          console.error("Failed to copy content: ", err);
        });
    }
  };

  // Find the first available image in the blog post directory
  useEffect(() => {
    if (isLoading) return;

    const findOgImage = async () => {
      try {
        const response = await fetch(`/assets/blog/${slug}/`);
        if (response.ok) {
          const text = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          const links = Array.from(doc.querySelectorAll("a"))
            .map((a) => a.getAttribute("href"))
            .filter((href) => href && /\.(png|jpg|jpeg|gif)$/i.test(href));

          if (links.length > 0) {
            setOgImage(`/assets/blog/${slug}/${links[0]}`);
          }
        }
      } catch (err) {
        console.error("Error finding OG image:", err);
      }
    };

    findOgImage();
  }, [slug, isLoading]);

  // Extract metadata for easier access
  const { title, date, readTime, author, lastUpdated, path } = post.meta;

  // Main content
  const mainContent = isLoading ? (
    <LoadingContent className="min-w-0 flex-1" fullHeight={true} />
  ) : (
    <div className="min-w-0 flex-1 px-2">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="mb-4 text-2xl font-semibold sm:text-3xl md:text-4xl">{title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {date} · {readTime} · By {author}
          </p>
          {lastUpdated && (
            <p className="text-muted-foreground mt-1 text-sm italic sm:text-base">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <div
          id="blog-content"
          className="bg-background border-border blog-content rounded-xl border p-4 shadow-sm sm:p-6"
        >
          {post.mdx ? (
            <PagefindMeta
              title={post.meta.title}
              description={post.meta.description}
              searchWeight={0.5}
              section={"blog"}
            >
              <MDXRenderer code={post.mdx.code} frontmatter={post.mdx.frontmatter} />
            </PagefindMeta>
          ) : (
            <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />
          )}
        </div>
      </div>
    </div>
  );

  // Right sidebar content - loading state or actual content
  const rightSidebarContent = isLoading ? (
    <div className="h-full">
      <div className="bg-muted mx-4 mt-16 h-6 animate-pulse rounded-md"></div>
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 lg:pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={copyContentAsMarkdown}
          disabled={isCopied}
          className="w-full"
        >
          {isCopied ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="mr-1 h-4 w-4" />
              Copy as Markdown
            </>
          )}
        </Button>

        <h4 className="text-muted-foreground mt-3 text-sm font-medium">On this page</h4>
      </div>

      <div className="flex-grow overflow-y-auto pr-4 pb-6 pl-4">
        <TableOfContents contentId="blog-content" path={path} />
      </div>
    </div>
  );

  return (
    <>
      <SEOMeta
        title={title}
        description={post.meta.description || post.mdx?.frontmatter?.excerpt}
        image={ogImage}
        url={`/blog/${slug}`}
        type="article"
        article={{
          publishedTime: date,
          modifiedTime: lastUpdated,
          author: author,
        }}
      />
      <AppLayout>
        <AppLayout.LeftSidebar className="pt-1" collapsible={false}>
          <div className="pr-10">
            <BackToBlogLink />
          </div>
        </AppLayout.LeftSidebar>

        <AppLayout.Content>{mainContent}</AppLayout.Content>

        <AppLayout.RightSidebar
          className={isLoading ? undefined : "pt-1"}
          mobileCollapsible={true}
          mobileTitle="Table of Contents"
        >
          {rightSidebarContent}
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
}
