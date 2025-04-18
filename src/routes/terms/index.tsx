import { createFileRoute, redirect } from "@tanstack/react-router";
import { environment } from "@/lib/content/environment";

// Redirect /terms/ to /terms/use
export const Route = createFileRoute("/terms/")({
  beforeLoad: () => {
    throw redirect({ to: "/terms/use" });
  },
  onError: (error: Error) => environment.onError(error),
});
