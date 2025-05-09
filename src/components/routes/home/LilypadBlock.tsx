import { ButtonLink } from "@/src/components/ui/button-link";
import { ResponsiveTextBlock } from "@/src/components/ui/responsive-text-block";
import { BookOpen, Rocket } from "lucide-react";
import { ProviderTabbedSection } from "@/src/components/mdx/elements/ProviderTabbedSection";
import { LilypadDemo } from "./LilypadDemo";

// Lilypad feature block component
export const LilypadBlock = () => {
  return (
    <div
      data-product="lilypad"
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
    >
      <ResponsiveTextBlock
        lines={["Spin up your data flywheel", "with one line of code"]}
        element="h2"
        fontSize="clamp(1.5rem, 5vw, 3rem)"
        className="mb-6 text-center text-white"
        lineClassName="font-bold"
        lineSpacing="mb-2"
        textShadow={true}
      />
      <div className="mb-2 w-full max-w-3xl">
        <div className="bg-background/60 mb-2 w-full rounded-md">
          <ProviderTabbedSection>
            <div className="mb-2">
              <LilypadDemo />
            </div>
          </ProviderTabbedSection>
        </div>
      </div>

      <div className="mt-2 flex w-full max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
        <ButtonLink
          href="/docs/lilypad"
          variant="default"
          size="default"
          className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[200px] px-6 py-4 text-center font-medium sm:w-auto"
        >
          <BookOpen className="size-5" aria-hidden="true" /> Lilypad Docs
        </ButtonLink>
        <ButtonLink
          href="/pricing"
          variant="outline"
          size="default"
          className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[200px] border-0 bg-white px-6 py-4 text-center font-medium text-black hover:bg-gray-100 hover:text-black sm:w-auto"
        >
          <Rocket className="size-5" aria-hidden="true" /> Open Beta
        </ButtonLink>
      </div>
    </div>
  );
};
