import { Loader2, Play } from "lucide-react";
import { cn } from "@/mirascope-ui/lib/utils";

export interface RunButtonProps {
  onRun?: () => void;
  status?: "idle" | "running";
}

export const RunButton = ({ onRun, status }: RunButtonProps) => {
  return (
    <button
      className={cn(
        "bg-background relative rounded-md border p-1.5",
        "hover:bg-muted cursor-pointer"
      )}
      aria-label="Run code"
      title="Run code"
      onClick={onRun}
    >
      {status === "running" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
    </button>
  );
};
