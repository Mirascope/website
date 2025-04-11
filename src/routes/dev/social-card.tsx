import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/dev/social-card")({
  component: SocialCardPreview,
});

// Helper interface for iframe communication
declare global {
  interface Window {
    updateSocialCard?: (title: string, description: string) => void;
  }
}

function SocialCardPreview() {
  const [title, setTitle] = useState("Your Title Goes Here");
  const [description, setDescription] = useState(
    "Your description text here. This will be shown below the title."
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Update the card when form values change
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow?.updateSocialCard) {
      iframeRef.current.contentWindow.updateSocialCard(title, description);
    }
  }, [title, description, iframeLoaded]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);

    // Apply initial values
    if (iframeRef.current?.contentWindow?.updateSocialCard) {
      iframeRef.current.contentWindow.updateSocialCard(title, description);
    }
  };

  // Handle real-time updates (as user types)
  const updateCard = () => {
    if (iframeRef.current?.contentWindow?.updateSocialCard) {
      iframeRef.current.contentWindow.updateSocialCard(title, description);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Social Card Preview</h1>

      <div className="mb-8 bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-700 mb-2">
          This is a development page to preview how social cards will look. Edit the fields below to
          test different titles and descriptions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <div
              className="transform origin-top-left scale-50 p-4"
              style={{ width: "200%", height: "200%" }}
            >
              <iframe
                ref={iframeRef}
                id="social-card-iframe"
                src="/dev/social-card.html"
                className="border-0 w-full"
                style={{ width: "1200px", height: "630px" }}
                title="Social Card Preview"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block font-medium mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Slight delay to reduce update frequency during rapid typing
                  setTimeout(updateCard, 100);
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="description" className="block font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  // Slight delay to reduce update frequency during rapid typing
                  setTimeout(updateCard, 100);
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Font Size Rules</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Short titles (&le; 30 chars): 72px</li>
              <li>Medium titles (31-50 chars): 64px</li>
              <li>Long titles (51-70 chars): 56px</li>
              <li>Very long titles (&gt; 70 chars): 48px</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Line height and description font size also adjust based on title length.
            </p>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Direct URL Preview</h3>
            <p className="text-sm mb-3">
              You can also use URL parameters to preview specific content:
            </p>
            <code className="block p-3 bg-gray-800 text-white rounded text-xs overflow-x-auto whitespace-pre">
              /dev/social-card.html?title=Your+Custom+Title&description=Your+custom+description
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
