import { Check, Loader2, Play } from "lucide-react";
import { cn } from "@/mirascope-ui/lib/utils";

export interface RunButtonProps {
  onRun?: () => void;
  status?: "idle" | "running" | "done";
}

export const RunButton = ({ onRun, status }: RunButtonProps) => {
  return (
    <button
      className={cn(
        "bg-background relative rounded-md border p-1.5",
        "hover:bg-muted cursor-pointer"
      )}
      aria-label="Run"
      title="Run"
      onClick={onRun}
      disabled={status === "running"}
    >
      {status === "running" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : status === "done" ? (
        <Check className="size-4" />
      ) : (
        <Play className="size-4" />
      )}
    </button>
  );
};
