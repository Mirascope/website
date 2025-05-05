import { createFileRoute } from "@tanstack/react-router";
import { Logo, SEOMeta } from "@/src/components/";
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
      <div className="mt-0 flex min-h-[calc(100vh-200px)] flex-col items-center justify-center overflow-hidden py-8 md:-mt-16 md:py-0">
        <div className="flex w-full flex-col items-center px-4 text-center">
          <div className="mb-6 flex justify-center sm:mb-8 md:mb-10">
            <Logo
              size="large"
              withText={true}
              background={true}
              showLilypad={false}
              textClassName="text-4xl sm:text-5xl md:text-6xl"
              className="px-8 py-5"
            />
          </div>

          <div className="landing-page-text-shadow mt-0 flex flex-col font-medium tracking-tight text-white">
            <span
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
              className="font-handwriting mb-8 whitespace-normal sm:whitespace-nowrap"
            >
              The AI Engineer's
            </span>
            <span
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
              className="font-handwriting whitespace-normal sm:whitespace-nowrap"
            >
              Developer Stack
            </span>
          </div>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row md:mt-14">
            <ButtonLink
              href="/docs/mirascope"
              variant="default"
              size="lg"
              className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] px-8 py-6 text-center text-lg font-medium sm:w-auto"
            >
              <BookOpen className="size-6" aria-hidden="true" /> Learn more
            </ButtonLink>
            <ButtonLink
              href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
              variant="outline"
              size="lg"
              className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] border-0 bg-white px-8 py-6 text-center text-lg font-medium text-black hover:bg-gray-100 hover:text-black sm:w-auto"
            >
              <Users className="size-6" aria-hidden="true" /> Join the community
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
