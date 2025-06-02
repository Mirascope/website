import { createFileRoute } from "@tanstack/react-router";
import { LilypadPricingPage } from "@/src/components/routes/LilypadPricingPage";
import { environment } from "@/src/lib/content/environment";

export const Route = createFileRoute("/pricing")({
  component: LilypadPricingPage,
  onError: (error: Error) => environment.onError(error),
});
