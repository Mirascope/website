import { Play } from "lucide-react";
import { cn } from "@/mirascope-ui/lib/utils";

export interface RunButtonProps {
  onRun?: () => void;
  disabled?: boolean;
}

export const RunButton = ({ onRun, disabled = false }: RunButtonProps) => {
  return (
    <button
      className={cn(
        "bg-background relative rounded-md border p-1.5",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted cursor-pointer"
      )}
      aria-label="Run code"
      title="Run code"
      onClick={onRun}
      disabled={disabled}
    >
      <Play className="size-4" />
    </button>
  );
};
