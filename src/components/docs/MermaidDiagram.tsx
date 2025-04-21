import { useEffect, useRef, useState } from "react";
import { LoadingContent } from "@/src/components/docs";
import mermaid, { type MermaidConfig } from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

type ThemeName = "dark" | "sunset" | "default";

/**
 * Renders mermaid diagrams in MDX content
 */
export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`);
  const themeRef = useRef<ThemeName>(getThemeConfig());

  // Determine which theme config to use based on current theme
  function getThemeConfig(): ThemeName {
    if (document.documentElement.classList.contains("dark")) {
      return "dark";
    } else if (document.documentElement.classList.contains("sunset")) {
      return "sunset";
    } else {
      return "default";
    }
  }

  // Custom theme configuration
  function getThemeOptions(themeName: ThemeName): MermaidConfig {
    const baseConfig: MermaidConfig = {
      startOnLoad: false,
      securityLevel: "loose",
      fontFamily: "inherit",
    };

    if (themeName === "dark") {
      return {
        ...baseConfig,
        theme: "dark",
        themeVariables: {
          primaryColor: "#6366F1", // Brand purple
          primaryTextColor: "#F3F4F6",
          primaryBorderColor: "#818CF8", // Lighter purple
          lineColor: "#818CF8", // Lighter purple
          secondaryColor: "#1F2937",
          tertiaryColor: "#111827",
          mainBkg: "#312E81", // Dark indigo
          secondaryBorderColor: "#4F46E5", // Darker purple
          textColor: "#E5E7EB",
          nodeBorder: "#6366F1", // Brand purple
          noteTextColor: "#d1d5db",
          noteBkgColor: "#4338CA", // Darker indigo
          noteBorderColor: "#6366F1", // Brand purple
        },
      };
    } else if (themeName === "sunset") {
      return {
        ...baseConfig,
        theme: "base",
        themeVariables: {
          primaryColor: "#F97316", // Orange
          primaryTextColor: "#1E293B", // Dark text
          primaryBorderColor: "#FDBA74", // Light orange
          lineColor: "#C2410C", // Dark orange
          secondaryColor: "#FEF3C7", // Light yellow
          tertiaryColor: "#FFF7ED", // Light orange background
          mainBkg: "#FFEDD5", // Light orange background
          secondaryBorderColor: "#FB923C", // Medium orange
          textColor: "#7C2D12", // Dark orange text
          nodeBorder: "#F97316", // Orange
          noteTextColor: "#7C2D12", // Dark orange text
          noteBkgColor: "#FED7AA", // Very light orange
          noteBorderColor: "#FB923C", // Medium orange
          edgeLabelBackground: "#FEF3C7", // Light yellow
        },
      };
    } else {
      // Default light theme
      return {
        ...baseConfig,
        theme: "default",
        themeVariables: {
          primaryColor: "#6366F1", // Brand purple
          primaryTextColor: "#1E293B", // Slate text
          primaryBorderColor: "#818CF8", // Lighter purple
          lineColor: "#6366F1", // Brand purple
          secondaryColor: "#F1F5F9", // Light slate
          tertiaryColor: "#F8FAFC", // Extra light slate
          edgeLabelBackground: "#F8FAFC", // Extra light slate
        },
      };
    }
  }

  const renderDiagram = async () => {
    if (!chart) return;

    try {
      // Get current theme and update theme reference
      const currentTheme = getThemeConfig();
      themeRef.current = currentTheme;

      // Initialize mermaid with theme-specific configuration
      mermaid.initialize(getThemeOptions(currentTheme));

      // Reset svg content to force re-rendering
      setSvgContent(null);

      // Use a new ID for each render to avoid caching issues
      const renderId = `${uniqueId.current}-${Date.now()}`;
      const { svg } = await mermaid.render(renderId, chart);
      setSvgContent(svg);
      setError(null);
    } catch (err) {
      console.error("Mermaid rendering error:", err);
      setError(`Failed to render diagram: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Initial render
  useEffect(() => {
    renderDiagram();
  }, [chart]);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = getThemeConfig();

      // Only re-render if theme actually changed
      if (themeRef.current !== currentTheme) {
        themeRef.current = currentTheme;
        renderDiagram();
      }
    };

    // Use MutationObserver to detect theme changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          handleThemeChange();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
        <p className="font-medium">Diagram Error</p>
        <p className="text-sm font-mono whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`mermaid-diagram overflow-x-auto my-6 rounded-md bg-background p-4 ${className}`}
      ref={mermaidRef}
    >
      {svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />
      )}
    </div>
  );
}
