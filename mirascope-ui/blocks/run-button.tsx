import { Play } from "lucide-react";

export interface RunButtonProps {
  onRun?: () => void;
}

export const RunButton = ({ onRun }: RunButtonProps) => {
  return (
    <button
      className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
      aria-label="Run code"
      title="Run code"
      onClick={onRun}
    >
      <Play className="size-4" />
    </button>
  );
};
