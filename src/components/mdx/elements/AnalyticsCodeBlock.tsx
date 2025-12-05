import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { CodeBlock } from "@/mirascope-ui/blocks/code-block/code-block";
import { useProduct } from "@/src/components/core";
import analyticsManager from "@/src/lib/services/analytics";
import { getCassetteUrl, ReplayCassette } from "@/src/lib/content/vcr-cassettes";
import { lastValueFrom, timer } from "rxjs";
interface AnalyticsCodeBlockProps {
  code: string;
  language?: string;
  meta?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function AnalyticsCodeBlock({
  code,
  language,
  meta,
  className,
  showLineNumbers,
}: AnalyticsCodeBlockProps) {
  const [replay, setReplay] = useState<ReplayCassette | undefined>(undefined);
  const [output, setOutput] = useState<string>("");
  const [cassetteURL, setCassetteURL] = useState<URL | undefined>(undefined);
  const product = useProduct();
  const codeRef = useRef<HTMLDivElement>(null);

  // Compute cassette URL only on the client side to avoid SSR issues
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!code || !language?.startsWith("py")) {
      setCassetteURL(undefined);
      return;
    }

    try {
      const url = getCassetteUrl(code, window.location);
      setCassetteURL(url);
    } catch (err) {
      if (err instanceof Error && !err.message.includes("No __filepath__ found in code")) {
        throw err;
      }
      setCassetteURL(undefined);
    }
  }, [code, language]);

  useEffect(() => {
    if (!cassetteURL || replay) {
      return;
    }

    const setupReplay = async () => {
      try {
        const replay = await ReplayCassette.fromUrl(cassetteURL);
        setReplay(replay);
      } catch (err) {
        console.error("Unexpected error fetching cassette:", err);
      }
    };
    setupReplay();
  }, [cassetteURL, replay]);

  const onlyCode = useMemo(() => {
    return code.replace(/^__filepath__ = ".*";\n\n/, "");
  }, [code]);

  // Create a stable identifier for this code block based on its content
  // This ensures the ID remains consistent across rerenders
  const codeHash = useMemo(() => {
    // Simple hash function for the code content
    let hash = 0;
    for (let i = 0; i < onlyCode.length; i++) {
      const char = onlyCode.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }, [onlyCode]);

  const onCopy = () => {
    const pagePath = window.location.pathname;
    // Use path, language and hash of code to create a stable identifier
    const itemId = `${pagePath}#${language || "code"}-${codeHash}`;

    analyticsManager.trackCopyEvent({
      contentType: "code_snippet",
      itemId,
      product,
      language: language || "text",
    });
  };

  const runCode = useCallback(async (): Promise<void> => {
    if (!replay) {
      return;
    }
    setOutput("");

    const stream = replay.play({
      delays: {
        interaction: (type) => {
          // 500ms fixed + random delta (up to 10s for "request", 1s otherwise)
          const delta = type === "request" ? 10_000 : 1_000;
          return timer(500 + Math.random() * delta);
        },
        chunk: (type) => {
          // 0ms for "request", else 20ms + random up to 100ms
          return type === "request" ? timer(0) : timer(20 + Math.random() * 100);
        },
      },
    });

    stream.subscribe({
      next: (chunk) => setOutput((prev) => prev + chunk),
    });

    return lastValueFrom(stream).then();
  }, [replay]);

  return (
    <div ref={codeRef} data-code-hash={codeHash} className="analytics-code-block">
      <CodeBlock
        code={onlyCode}
        output={output}
        language={language}
        meta={meta}
        className={className}
        showLineNumbers={showLineNumbers}
        onCopy={onCopy}
        onRun={replay ? runCode : undefined}
      />
    </div>
  );
}
