import { useCallback, useState } from "react";
import { useRunnable } from "@/src/components/core/providers/RunnableContext";
import { Play, LoaderCircle } from "lucide-react";

export interface RunButtonProps {
  content: string;
  language: string;
  onRun?: (running: boolean) => void;
}

export const RunButton = ({ content, language, onRun }: RunButtonProps) => {
  const runnable = useRunnable();
  const [running, setRunning] = useState(false);
  const runCode = useCallback(() => {
    if (!runnable || !runnable.stdout || !runnable.stderr) {
      return;
    }

    console.log("running code");
    setRunning(true);
    onRun?.(true);

    // avoid blocking the main thread
    setTimeout(() => {
      runnable.runPython(content).then(() => {
        console.log("done running code");
        onRun?.(false);
        setRunning(false);
      });
    }, 50);
  }, [content, runnable, runnable.stdout, runnable.stderr, onRun]);

  if (!language.toLowerCase().startsWith("py")) {
    return null;
  }

  return (
    <button
      className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
      onClick={runCode}
      aria-label="Copy code"
      title="Copy code"
    >
      {running ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
    </button>
  );
};
