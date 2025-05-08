import { Logo, SEOMeta } from "@/src/components/";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { ButtonLink } from "@/src/components/ui/button-link";
import { BookOpen, Users, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { CodeBlock } from "@/src/components/mdx/elements/CodeBlock";

export function LandingPage() {
  useSunsetTime();
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const featureSectionRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(true);

  // Function to scroll to feature section
  const scrollToFeatureSection = () => {
    featureSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to hide button when scrolled past the first section
  useEffect(() => {
    const handleScroll = () => {
      if (heroSectionRef.current) {
        const heroHeight = heroSectionRef.current.offsetHeight;
        const scrollPosition = window.scrollY;

        // Hide button when scrolled past 80% of the hero section height
        setShowScrollButton(scrollPosition < heroHeight * 0.4);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const codeExample = `from mirascope import llm # [!code highlight]
from pydantic import BaseModel

class Book(BaseModel):
    title: str
    author: str

@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book) # [!code highlight]
def extract_book(text: str) -> str:
    return f"Extract the book: {text}"

text = "The Name of the Wind by Patrick Rothfuss"
book: Book = extract_book(text) # [!code highlight]
assert isinstance(book, Book)`;

  return (
    <>
      <SEOMeta title="Home" description="The AI Engineer's Developer Stack" />
      <div className="flex w-full flex-col">
        {/* Hero section - with negative margin to offset header */}
        <div
          ref={heroSectionRef}
          className="relative h-screen"
          style={{ marginTop: "calc(var(--header-height-base) * -1)" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
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
          </div>

          {/* Scroll indicator - fixed at bottom with animated visibility */}
          <div
            className={`fixed right-0 bottom-16 left-0 z-10 flex justify-center transition-opacity duration-300 ${
              showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button
              onClick={scrollToFeatureSection}
              className="bg-primary bg-opacity-20 hover:bg-opacity-30 flex h-12 w-12 items-center justify-center rounded-full transition-all"
              aria-label="Scroll to learn more"
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Feature section */}
        <div
          ref={featureSectionRef}
          className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
        >
          <h2 className="landing-page-text-shadow mb-2 text-center text-4xl font-bold text-white md:text-5xl">
            LLM abstractions that
          </h2>
          <h2 className="landing-page-text-shadow mb-8 text-center text-4xl font-bold text-white md:text-5xl">
            aren't obstructions
          </h2>
          <div className="mb-10 w-full max-w-3xl">
            <CodeBlock code={codeExample} language="python" />
          </div>

          <div className="mt-4 flex w-full max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink
              href="/docs/mirascope"
              variant="default"
              size="lg"
              className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] px-8 py-6 text-center text-lg font-medium sm:w-auto"
            >
              <BookOpen className="size-6" aria-hidden="true" /> Mirascope Docs
            </ButtonLink>
            <ButtonLink
              href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
              variant="outline"
              size="lg"
              className="landing-page-box-shadow landing-page-box-shadow-hover w-full min-w-[220px] border-0 bg-white px-8 py-6 text-center text-lg font-medium text-black hover:bg-gray-100 hover:text-black sm:w-auto"
            >
              <Users className="size-6" aria-hidden="true" /> Join the Community
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
