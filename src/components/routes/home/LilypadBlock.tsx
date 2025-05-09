import { ButtonLink } from "@/src/components/ui/button-link";
import { ResponsiveTextBlock } from "@/src/components/ui/responsive-text-block";
import { BookOpen, Rocket } from "lucide-react";
import { ProviderTabbedSection } from "@/src/components/mdx/elements/ProviderTabbedSection";
import { ProviderCodeWrapper } from "@/src/components/mdx/providers/ProviderCodeWrapper";
import { LilypadDemo } from "./LilypadDemo";

// Lilypad feature block component
export const LilypadBlock = () => {
  const codeExample = `
import lilypad
from mirascope import llm
lilypad.configure(auto_llm=True)

@lilypad.trace(versioning="automatic") # [!code highlight]
@llm.call(provider="$PROVIDER", model="$MODEL")
def answer_question(question: str) -> str:
    return f"Answer in one word: {question}"

answer_question("What is the capital of France?")
`;

  return (
    <div
      data-product="lilypad"
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
    >
      <ResponsiveTextBlock
        lines={["Start building your data", "flywheel with one line of code"]}
        element="h2"
        fontSize="clamp(1.5rem, 5vw, 3rem)"
        className="mb-6 text-center text-white"
        lineClassName="font-bold"
        lineSpacing="mb-2"
        textShadow={true}
      />
      <div className="mb-8 w-full max-w-3xl">
        <div className="bg-background/60 mb-2 w-full rounded-md">
          <ProviderTabbedSection
            customHeader={
              <div className="flex items-center px-2 pb-2">
                <div className="flex flex-row items-center justify-center">
                  <div className="mr-1.5">
                    <img
                      src="/assets/branding/lilypad-logo.svg"
                      alt="Lilypad Logo"
                      className="h-4 w-auto"
                    />
                  </div>
                  <h1 className="text-s font-handwriting text-lilypad-green mb-0">Lilypad</h1>
                </div>
              </div>
            }
          >
            <ProviderCodeWrapper code={codeExample} language="python" />
          </ProviderTabbedSection>
        </div>

        {/* Add the LilypadDemo component */}
        <div className="mt-4">
          <LilypadDemo />
        </div>
      </div>

      <div className="mt-2 flex w-full max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
        <ButtonLink
          href="/docs/lilypad"
          variant="default"
          size="lg"
          className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] px-8 py-6 text-center text-lg font-medium sm:w-auto"
        >
          <BookOpen className="size-6" aria-hidden="true" /> Lilypad Docs
        </ButtonLink>
        <ButtonLink
          href="https://lilypad.so"
          variant="outline"
          size="lg"
          className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] border-0 bg-white px-8 py-6 text-center text-lg font-medium text-black hover:bg-gray-100 hover:text-black sm:w-auto"
        >
          <Rocket className="size-6" aria-hidden="true" /> Open Beta
        </ButtonLink>
      </div>
    </div>
  );
};
