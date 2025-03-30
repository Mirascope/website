import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
});

function DocsIndexPage() {
  // Redirect to the Mirascope main docs by default
  return <Navigate to="/docs/mirascope/main/index" />;
}