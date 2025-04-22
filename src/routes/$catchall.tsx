import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/src/components/NotFound";
import { environment } from "@/src/lib/content/environment";

export const Route = createFileRoute("/$catchall")({
  component: () => <NotFound />,
  onError: (error: Error) => environment.onError(error),
  validateSearch: () => ({}),
});
