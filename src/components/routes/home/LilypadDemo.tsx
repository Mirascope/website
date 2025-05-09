import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type TraceLabel = "pass" | "fail";

interface Trace {
  id: string;
  version: number;
  label: TraceLabel;
  timestamp: string;
  input: string;
  output: string;
  cost: number;
  tokens: number;
}

export function LilypadDemo() {
  // Sample trace data
  const traces: Trace[] = [
    {
      id: "trace_1",
      version: 2,
      label: "pass",
      timestamp: "1 min ago",
      input: "Answer in one word: What is the capital of France?",
      output: "Paris",
      cost: 0.0012,
      tokens: 24,
    },
    {
      id: "trace_2",
      version: 2,
      label: "pass",
      timestamp: "2 mins ago",
      input: "Answer in one word: What is the capital of Italy?",
      output: "Rome",
      cost: 0.0011,
      tokens: 22,
    },
    {
      id: "trace_3",
      version: 1,
      label: "fail",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Spain?",
      output: "The capital of Spain is Madrid.",
      cost: 0.0018,
      tokens: 36,
    },
    {
      id: "trace_4",
      version: 1,
      label: "fail",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Portugal?",
      output: "The capital of Portugal is Lisbon.",
      cost: 0.0019,
      tokens: 38,
    },
    {
      id: "trace_5",
      version: 1,
      label: "pass",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Japan?",
      output: "Tokyo",
      cost: 0.0015,
      tokens: 30,
    },
  ];

  // State for selected trace
  const [selectedTraceId, setSelectedTraceId] = useState<string>(traces[0].id);

  // Get the selected trace
  const selectedTrace = traces.find((trace) => trace.id === selectedTraceId) || traces[0];

  return (
    <div className="border-border/60 bg-background w-full max-w-3xl overflow-hidden rounded-lg border backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">answer_question</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            v{selectedTrace.version}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row">
        {/* Traces table - takes 60% width on larger screens */}
        <div className="border-border/60 border-r md:w-3/5">
          <div className="border-border/60 border-b px-4 py-2">
            <h3 className="text-sm font-medium">Traces</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {/* Headers - Flexbox Row */}
            <div className="bg-muted/50 sticky top-0 flex w-full text-xs">
              <div className="text-muted-foreground w-[10%] flex-shrink-0 px-4 py-2 font-medium">
                Ver
              </div>
              <div className="text-muted-foreground w-[10%] flex-shrink-0 px-4 py-2 font-medium">
                Label
              </div>
              <div className="text-muted-foreground w-[25%] flex-shrink-0 px-4 py-2 font-medium">
                Time
              </div>
              <div className="text-muted-foreground w-[15%] flex-shrink-0 px-4 py-2 font-medium">
                Cost
              </div>
              <div className="text-muted-foreground w-[15%] flex-shrink-0 px-4 py-2 font-medium">
                Tokens
              </div>
            </div>

            {/* Rows */}
            {traces.map((trace) => (
              <div
                key={trace.id}
                className={`flex w-full cursor-pointer text-xs ${selectedTraceId === trace.id ? "hover:bg-accent/50 bg-accent/30" : "hover:bg-muted/30"}`}
                onClick={() => setSelectedTraceId(trace.id)}
              >
                <div className="border-border/20 w-[10%] flex-shrink-0 border-t px-4 py-2">
                  {trace.version}
                </div>
                <div className="border-border/20 w-[10%] flex-shrink-0 border-t px-4 py-2">
                  {trace.label === "pass" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="border-border/20 text-muted-foreground w-[25%] flex-shrink-0 border-t px-4 py-2">
                  {trace.timestamp}
                </div>
                <div className="border-border/20 text-muted-foreground w-[15%] flex-shrink-0 border-t px-4 py-2">
                  ${trace.cost.toFixed(4)}
                </div>
                <div className="border-border/20 text-muted-foreground w-[15%] flex-shrink-0 border-t px-4 py-2">
                  {trace.tokens}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages pane - takes 40% width on larger screens */}
        <div className="flex flex-col md:w-2/5">
          <div className="border-border/60 border-b px-4 py-2">
            <h3 className="text-sm font-medium">Messages</h3>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto p-2">
            {/* User message card */}
            <div className="bg-card/30 overflow-hidden rounded-lg">
              <div className="px-4 pt-2">
                <h4 className="text-s font-semibold">User</h4>
                <p className="text-s py-2 break-words">{selectedTrace.input}</p>
              </div>
            </div>

            {/* Assistant message card */}
            <div className="bg-card/30 overflow-hidden rounded-lg">
              <div className="px-4 py-2">
                <h4 className="text-s font-semibold">Assistant</h4>
                <p className="text-s py-2 break-words">{selectedTrace.output}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
