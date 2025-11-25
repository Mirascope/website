import { Play } from "lucide-react";

export interface RunButtonProps {
  onRun?: () => void;
}

export const RunButton = ({ onRun }: RunButtonProps) => {
  // const runnable = useRunnable();
  // const [running, setRunning] = useState(false);
  // const runCode = useCallback(() => {
  //   if (!runnable || !runnable.stdout || !runnable.stderr) {
  //     return;
  //   }

  //   console.log("running code");
  //   setRunning(true);
  //   onRun?.();

  //   // avoid blocking the main thread
  //   setTimeout(() => {
  //     runnable.runPython(content).then(() => {
  //       console.log("done running code");
  //       onRun?.();
  //       setRunning(false);
  //     });
  //   }, 50);
  // }, [content, runnable, runnable.stdout, runnable.stderr, onRun]);

  return (
    <button
      className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
      aria-label="Run code"
      title="Run code"
      onClick={onRun}
    >
      {/* {running ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />} */}
      <Play className="size-4" />
    </button>
  );
};
