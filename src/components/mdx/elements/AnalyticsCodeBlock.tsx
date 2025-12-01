import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { CodeBlock } from "@/mirascope-ui/blocks/code-block/code-block";
import { useProduct, useRunnable } from "@/src/components/core";
import analyticsManager from "@/src/lib/services/analytics";
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
  const VCRPY_CASSETTE_INTRO = "interactions:";

  const [output, setOutput] = useState<string>("");
  const [hasCachedHttp, setHasCachedHttp] = useState<boolean>(false);
  const product = useProduct();
  const codeRef = useRef<HTMLDivElement>(null);

  // Extract __filepath__ (if present) and the rest of the code.
  const codeFilePath = useMemo(() => {
    const match = code.match(/^__filepath__ = "(.*)";\n\n/);
    return match ? match[1] : "";
  }, [code]);
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

  const runnable = useRunnable();
  const { loading: runnableLoading } = runnable;
  const runCode = useCallback(async (): Promise<any> => {
    if (!runnable || runnableLoading) {
      return Promise.resolve();
    }
    // reset the output to empty string
    setOutput("");

    const { done, stdout } = await runnable.runPythonWithVCR(code);
    // subscribe to stdout to set the output
    stdout.subscribe({
      next: (chunk) => setOutput((prev) => prev + chunk),
      complete: () => console.log("running code complete"),
    });

    // todo(sebastian): do we want a trackRunEvent?
    try {
      // we don't use the result directly since python's main() writes to stdout
      return await done();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.log(error.message);
    }
  }, [setOutput, code, runnable, runnableLoading]);

  useEffect(() => {
    if (!codeFilePath) {
      return;
    }
    const cassetteURL = runnable.getVcrpyCassetteUrl(code);
    const checkCassette = async () => {
      try {
        const res = await fetch(cassetteURL);
        if (res.status >= 400) {
          setHasCachedHttp(false);
          return;
        }
        const text = await res.text();
        setHasCachedHttp(text.startsWith(VCRPY_CASSETTE_INTRO));
      } catch (err) {
        setHasCachedHttp(false);
        console.warn("Error checking cassette:", err);
      }
    };
    checkCassette();
  }, [codeFilePath, runnable]);

  const onRunFunc = useMemo(() => {
    if (!language?.startsWith("py") || !hasCachedHttp) {
      return undefined;
    }
    if (runnableLoading) {
      return undefined;
    }
    return runCode;
  }, [runnableLoading, runCode, hasCachedHttp]);

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
        onRun={onRunFunc}
      />
    </div>
  );
}
