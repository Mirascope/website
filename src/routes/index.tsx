import { createFileRoute } from "@tanstack/react-router";
import Logo from "@/src/components/Logo";
import SEOMeta from "@/src/components/SEOMeta";
import { environment } from "@/src/lib/content/environment";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { ButtonLink } from "@/src/components/ui/button-link";
import { BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  onError: (error: Error) => environment.onError(error),
});

function LandingPage() {
  useSunsetTime();
  return (
    <>
      <SEOMeta title="Home" description="The AI Engineer's Developer Stack" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] mt-0 md:-mt-16 py-8 md:py-0 overflow-hidden">
        <div className="text-center flex flex-col items-center w-full px-4">
          <div className="mb-6 sm:mb-8 md:mb-10 flex justify-center">
            <Logo
              size="large"
              withText={true}
              background={true}
              textClassName="text-4xl sm:text-5xl md:text-6xl"
              className="px-8 py-5"
            />
          </div>

          <div className="text-white mt-0 flex flex-col font-medium tracking-tight landing-page-text-shadow">
            <span
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
              className="whitespace-normal sm:whitespace-nowrap font-handwriting mb-8"
            >
              The AI Engineer's
            </span>
            <span
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
              className="whitespace-normal sm:whitespace-nowrap font-handwriting"
            >
              Developer Stack
            </span>
          </div>

          <div className="mt-10 sm:mt-12 md:mt-14 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <ButtonLink
              href="/docs/mirascope"
              variant="default"
              size="lg"
              className="w-full sm:w-auto min-w-[220px] text-center font-medium text-lg py-6 px-8 landing-page-box-shadow"
            >
              <BookOpen className="size-6" aria-hidden="true" /> Learn more
            </ButtonLink>
            <ButtonLink
              href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[220px] text-center font-medium text-lg py-6 px-8 bg-white text-black border-0 landing-page-box-shadow"
            >
              <Users className="size-6" aria-hidden="true" /> Join the community
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
