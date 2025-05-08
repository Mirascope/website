import { Logo, SEOMeta } from "@/src/components/";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { ButtonLink } from "@/src/components/ui/button-link";
import { ResponsiveTextBlock } from "@/src/components/ui/responsive-text-block";
import { BookOpen, Users, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ProviderTabbedSection } from "@/src/components/mdx/elements/ProviderTabbedSection";
import { ProviderCodeWrapper } from "@/src/components/mdx/providers/ProviderCodeWrapper";
import { ProviderContextProvider } from "@/src/components/core/providers/ProviderContext";

// Hero block component with logo and text
interface HeroBlockProps {
  onScrollDown: () => void;
  showScrollButton: boolean;
}

const HeroBlock = ({ onScrollDown, showScrollButton }: HeroBlockProps) => {
  return (
    <div
      className="relative h-screen"
      style={{ marginTop: "calc(var(--header-height-base) * -1)" }}
    >
      {/* Combined logo and hero text container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        {/* Logo with responsive margin */}
        <div style={{ marginBottom: "clamp(3rem, 10vh, 6rem)" }}>
          <Logo
            size="large"
            withText={true}
            background={true}
            showLilypad={false}
            textClassName="text-4xl sm:text-5xl md:text-6xl"
            className="px-6 py-3 sm:px-8 sm:py-4"
          />
        </div>

        {/* Hero text */}
        <div className="text-center">
          <ResponsiveTextBlock
            lines={["The AI Engineer's", "Developer Stack"]}
            className="flex flex-col font-medium tracking-tight text-white"
            lineClassName="font-handwriting"
            textShadow={true}
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`fixed right-0 bottom-16 left-0 z-10 flex justify-center transition-opacity duration-300 ${
          showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="landing-page-box-shadow landing-page-box-shadow-hover relative h-12 w-12 overflow-hidden rounded-full">
          <button
            onClick={onScrollDown}
            className="bg-primary/80 hover:bg-primary absolute inset-0 flex items-center justify-center border-0 transition-all"
            aria-label="Scroll to learn more"
          >
            <ChevronDown className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Mirascope feature block component
const MirascopeBlock = () => {
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <ResponsiveTextBlock
        lines={["LLM abstractions that", "aren't obstructions"]}
        element="h2"
        fontSize="clamp(1.5rem, 5vw, 3rem)"
        className="mb-8 text-center text-white"
        lineClassName="font-bold"
        lineSpacing="mb-2"
        textShadow={true}
      />
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
  );
};

export function LandingPage() {
  useSunsetTime();
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const mirascopeSectionRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(true);

  // Function to scroll to mirascope section
  const scrollToMirascopeSection = () => {
    mirascopeSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to hide button when scrolled past the first section
  useEffect(() => {
    const handleScroll = () => {
      if (heroSectionRef.current) {
        const heroHeight = heroSectionRef.current.offsetHeight;
        const scrollPosition = window.scrollY;

        // Hide button when scrolled past 40% of the hero section height
        setShowScrollButton(scrollPosition < heroHeight * 0.4);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SEOMeta title="Home" description="The AI Engineer's Developer Stack" />
      <div className="flex w-full flex-col">
        {/* Hero section */}
        <div ref={heroSectionRef}>
          <HeroBlock onScrollDown={scrollToMirascopeSection} showScrollButton={showScrollButton} />
        </div>

        {/* Mirascope section */}
        <div ref={mirascopeSectionRef}>
          <MirascopeBlock />
        </div>
      </div>
    </>
  );
}
