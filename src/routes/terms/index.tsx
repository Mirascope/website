import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect /terms/ to /terms/use
export const Route = createFileRoute("/terms/")({
  beforeLoad: () => {
    throw redirect({ to: "/terms/use" });
  },
});
