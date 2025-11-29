import { useRef, useMemo, useCallback, useState } from "react";
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
  const onlyCode = useMemo(() => {
    return code.replace(/^__filepath__ = ".*";\n\n/, "");
  }, [code]);
  const [output, setOutput] = useState<string>("");
  const product = useProduct();
  const codeRef = useRef<HTMLDivElement>(null);

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

  const onRunFunc = useMemo(() => {
    if (!language?.startsWith("py")) {
      return undefined;
    }
    if (runnableLoading) {
      return undefined;
    }
    return runCode;
  }, [runnableLoading, runCode]);

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
