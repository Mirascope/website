import { Logo, SEOMeta } from "@/src/components/";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { ButtonLink } from "@/src/components/ui/button-link";
import { BookOpen, Users, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ProviderTabbedSection } from "@/src/components/mdx/elements/ProviderTabbedSection";
import { ProviderCodeWrapper } from "@/src/components/mdx/providers/ProviderCodeWrapper";
import { ProviderContextProvider } from "@/src/components/core/providers/ProviderContext";

// Base component for responsive text lines
const ResponsiveTextLine = ({
  children,
  size = "clamp(2.5rem, 8vw, 6rem)",
  className = "",
}: {
  children: React.ReactNode;
  size?: string;
  className?: string;
}) => (
  <span
    style={{ fontSize: size, lineHeight: "0.9" }}
    className={`whitespace-normal sm:whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

// Component for hero section text block
const HeroTextBlock = ({ lines }: { lines: string[] }) => (
  <div className="landing-page-text-shadow flex flex-col font-medium tracking-tight text-white">
    {lines.map((line, index) => (
      <ResponsiveTextLine
        key={index}
        className={`font-handwriting ${index < lines.length - 1 ? "mb-8" : ""}`}
      >
        {line}
      </ResponsiveTextLine>
    ))}
  </div>
);

// Component for feature section headings
const FeatureHeading = ({ lines }: { lines: string[] }) => (
  <>
    {lines.map((line, index) => (
      <h2
        key={index}
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
        className={`landing-page-text-shadow text-center font-bold text-white ${
          index < lines.length - 1 ? "mb-2" : "mb-8"
        }`}
      >
        {line}
      </h2>
    ))}
  </>
);

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

# [!code highlight:6]
@llm.call(
    provider="$PROVIDER", 
    model="$MODEL", 
    response_model=Book,
)
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
          {/* Logo positioned relative to the center */}
          <div
            className="absolute top-0 right-0 left-0 flex justify-center px-4"
            style={{
              top: "calc(50% - 170px - min(16vw, 120px))",
              transform: "translateY(-50%)",
            }}
          >
            <Logo
              size="large"
              withText={true}
              background={true}
              showLilypad={false}
              textClassName="text-4xl sm:text-5xl md:text-6xl"
              className="px-6 py-4 sm:px-8 sm:py-5"
            />
          </div>

          {/* Hero text perfectly centered vertically in the viewport */}
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <HeroTextBlock lines={["The AI Engineer's", "Developer Stack"]} />
          </div>

          {/* Scroll indicator - fixed at bottom with animated visibility and landing page shadow */}
          <div
            className={`fixed right-0 bottom-16 left-0 z-10 flex justify-center transition-opacity duration-300 ${
              showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="landing-page-box-shadow landing-page-box-shadow-hover relative h-12 w-12 overflow-hidden rounded-full">
              <button
                onClick={scrollToFeatureSection}
                className="bg-primary/80 hover:bg-primary absolute inset-0 flex items-center justify-center border-0 transition-all"
                aria-label="Scroll to learn more"
              >
                <ChevronDown className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div
          ref={featureSectionRef}
          className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
        >
          <FeatureHeading lines={["LLM abstractions that", "aren't obstructions"]} />
          <div className="bg-background/60 mb-10 w-full max-w-3xl rounded-md">
            <ProviderContextProvider>
              <ProviderTabbedSection showLogo={true}>
                <ProviderCodeWrapper code={codeExample} language="python" />
              </ProviderTabbedSection>
            </ProviderContextProvider>
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
