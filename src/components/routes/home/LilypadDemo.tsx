import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type TraceStatus = "pass" | "fail";

interface Trace {
  id: string;
  version: number;
  status: TraceStatus;
  timestamp: string;
  input: string;
  output: string;
}

export function LilypadDemo() {
  // Sample trace data
  const traces: Trace[] = [
    {
      id: "trace_1",
      version: 2,
      status: "pass",
      timestamp: "1 min ago",
      input: "Answer in one word: What is the capital of France?",
      output: "Paris",
    },
    {
      id: "trace_2",
      version: 2,
      status: "pass",
      timestamp: "2 mins ago",
      input: "Answer in one word: What is the capital of Italy?",
      output: "Rome",
    },
    {
      id: "trace_3",
      version: 1,
      status: "fail",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Spain?",
      output: "The capital of Spain is Madrid.",
    },
    {
      id: "trace_4",
      version: 1,
      status: "fail",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Portugal?",
      output: "The capital of Portugal is Lisbon.",
    },
    {
      id: "trace_5",
      version: 1,
      status: "pass",
      timestamp: "1 hr ago",
      input: "Answer this question: What is the capital of Japan?",
      output: "Tokyo",
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
        {/* Traces table - takes 40% width on larger screens */}
        <div className="border-border/60 border-r md:w-2/5">
          <div className="border-border/60 border-b px-4 py-2">
            <h3 className="text-sm font-medium">Traces</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-muted-foreground px-4 py-2 font-medium">Version</th>
                  <th className="text-muted-foreground px-4 py-2 font-medium">Label</th>
                  <th className="text-muted-foreground px-4 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr
                    key={trace.id}
                    className={`cursor-pointer ${selectedTraceId === trace.id ? "hover:bg-accent/50 bg-accent/30" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedTraceId(trace.id)}
                  >
                    <td className="border-border/20 border-t px-4 py-2">{trace.version}</td>
                    <td className="border-border/20 border-t px-4 py-2">
                      {trace.status === "pass" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </td>
                    <td className="border-border/20 text-muted-foreground border-t px-4 py-2">
                      {trace.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input/Output panes - takes 60% width on larger screens */}
        <div className="flex flex-col md:w-3/5">
          {/* Input pane */}
          <div className="border-border/60 border-t border-b md:border-t-0">
            <div className="border-border/60 border-b px-4 py-2">
              <h3 className="text-sm font-medium">Input</h3>
            </div>
            <div className="min-h-24 p-4 text-sm">
              <pre className="font-mono text-xs break-words whitespace-pre-wrap">
                <code>{selectedTrace.input}</code>
              </pre>
            </div>
          </div>

          {/* Output pane */}
          <div>
            <div className="border-border/60 border-b px-4 py-2">
              <h3 className="text-sm font-medium">Output</h3>
            </div>
            <div className="min-h-24 p-4 text-sm">
              <pre className="font-mono text-xs break-words whitespace-pre-wrap">
                <code>{selectedTrace.output}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
