import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import DevLayout from "@/src/components/dev/DevLayout";
import { environment } from "@/src/lib/content/environment";
import { getAllDevMeta } from "@/src/lib/content";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";
import { LoadingContent } from "@/src/components/docs";

export const Route = createFileRoute("/dev/social-card")({
  component: SocialCardPreview,
  loader: async () => {
    try {
      // Get all MDX-based dev pages for the sidebar
      const devPages = await getAllDevMeta();
      return { devPages };
    } catch (error) {
      console.error("Error loading dev pages:", error);
      return { devPages: [] };
    }
  },
  pendingComponent: () => {
    return (
      <DevLayout devPages={[]}>
        <div className="container py-8">
          <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />
        </div>
      </DevLayout>
    );
  },
  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="dev"
      />
    );
  },
});

// Helper interface for iframe communication
declare global {
  interface Window {
    updateSocialCard?: (title: string) => void;
    SOCIAL_CARD_CONFIG?: {
      fontSizes: Array<{
        maxChars: number;
        fontSize: string;
        label: string;
      }>;
    };
  }
}

// Define font size config type
type FontSizeRule = { maxChars: number; fontSize: string; label: string };

function SocialCardPreview() {
  const { devPages } = useLoaderData({ from: "/dev/social-card" });
  const [title, setTitle] = useState("Your Title Goes Here");
  const [fontSizeRules, setFontSizeRules] = useState<FontSizeRule[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Update the card when form values change
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow?.updateSocialCard) {
      iframeRef.current.contentWindow.updateSocialCard(title);
    }
  }, [title, iframeLoaded]);

  // Get the current font size rule that applies to this title length
  const getCurrentFontSizeRule = useCallback((): FontSizeRule | undefined => {
    return fontSizeRules.find((rule) => title.length <= rule.maxChars);
  }, [fontSizeRules, title.length]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);

    // Get font size config from iframe
    if (iframeRef.current?.contentWindow?.SOCIAL_CARD_CONFIG?.fontSizes) {
      setFontSizeRules(iframeRef.current.contentWindow.SOCIAL_CARD_CONFIG.fontSizes);
    }

    // Apply initial values
    if (iframeRef.current?.contentWindow?.updateSocialCard) {
      iframeRef.current.contentWindow.updateSocialCard(title);
    }
  };

  return (
    <DevLayout devPages={devPages}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Social Card Preview</h1>

        <p className="mb-6 text-gray-600">
          This page lets you preview how social cards will look. Edit the title to see the card
          update in real-time. Useful for iterating on the social-card.html file to preview changes
          to social cards and testing font sizing rules.
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="title" className="font-medium">
              Title
            </label>
            <span className="text-gray-500 text-sm">
              {title.length} characters
              {getCurrentFontSizeRule() &&
                ` - ${getCurrentFontSizeRule()?.fontSize} (${getCurrentFontSizeRule()?.label})`}
            </span>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex justify-center">
          <div
            className="border rounded-lg overflow-hidden bg-gray-50"
            style={{ width: "600px", height: "315px" }}
          >
            <div
              className="transform scale-50 origin-top-left"
              style={{ width: "200%", height: "200%" }}
            >
              <iframe
                ref={iframeRef}
                id="social-card-iframe"
                src="/dev/social-card.html"
                className="border-0"
                style={{ width: "1200px", height: "630px" }}
                title="Social Card Preview"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        </div>
      </div>
    </DevLayout>
  );
}
