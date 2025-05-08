import { SEOMeta } from "@/src/components/";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { useFadeOnScroll } from "@/src/lib/hooks/useFadeOnScroll";
import { ButtonLink } from "@/src/components/ui/button-link";
import { ResponsiveTextBlock } from "@/src/components/ui/responsive-text-block";
import { BookOpen, Users, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ProviderTabbedSection } from "@/src/components/mdx/elements/ProviderTabbedSection";
import { ProviderCodeWrapper } from "@/src/components/mdx/providers/ProviderCodeWrapper";
import { ProviderContextProvider } from "@/src/components/core/providers/ProviderContext";

// Shared styling constants for logo and hero components
// This ensures we maintain consistency and makes future updates easier
const styleSystem = {
  // Base dimensions for different components
  logoFontSize: "clamp(1.75rem, 4.5vw, 3.5rem)", // Smaller than hero text
  heroFontSize: "clamp(2.5rem, 8vw, 6rem)", // Larger than logo text
  lineHeightMultiplier: 0.9,

  // Spacing modifiers
  paddingInlineMultiplier: 0.75,
  paddingBlockMultiplier: 0.375,
  logoImageSpacingMultiplier: 0.375,
  logoToHeroSpacingMultiplier: 1,

  // Fine-tuning adjustment for vertical centering (positive = move up)
  centeringAdjustment: "0rem",
};

// Derived styles for logo component
const logoStyles = {
  // Base dimensions from style system
  fontSize: styleSystem.logoFontSize,
  lineHeightMultiplier: styleSystem.lineHeightMultiplier,

  // Derived measurements
  get lineHeight() {
    return `calc(${this.fontSize} * ${this.lineHeightMultiplier})`;
  },

  // Calculated spacing values
  get paddingInline() {
    return `calc(${this.lineHeight} * ${styleSystem.paddingInlineMultiplier})`;
  },
  get paddingBlock() {
    return `calc(${this.lineHeight} * ${styleSystem.paddingBlockMultiplier})`;
  },
  get totalPaddingBlock() {
    return `calc(${this.lineHeight} * ${styleSystem.paddingBlockMultiplier} * 2)`;
  },
  get logoImageSpacing() {
    return `calc(${this.lineHeight} * ${styleSystem.logoImageSpacingMultiplier})`;
  },
  get logoToHeroSpacing() {
    return `calc(${this.lineHeight} * ${styleSystem.logoToHeroSpacingMultiplier})`;
  },

  // Centering calculation - uses values from both logo and hero
  get centeringOffset() {
    // Half of (logo height + total vertical padding + spacing to hero)
    // Plus an additional adjustment for fine-tuning
    return `calc(((${this.lineHeight} + ${this.totalPaddingBlock} + 3 * ${this.logoToHeroSpacing}) / 2) + ${styleSystem.centeringAdjustment})`;
  },
};

// Logo banner component with responsive sizing
const LogoBanner = () => {
  return (
    <div
      className="relative"
      style={{
        // Use the shared styles for consistent dimensions
        paddingInline: logoStyles.paddingInline,
        paddingBlock: logoStyles.paddingBlock,
      }}
    >
      {/* Torn paper background effect */}
      <div className="torn-paper-effect absolute inset-0 bg-white"></div>

      {/* Logo content */}
      <div className="relative z-10">
        <div className="flex flex-row items-center justify-center">
          {/* Logo image */}
          <div style={{ marginRight: logoStyles.logoImageSpacing }}>
            <img
              src="/assets/branding/mirascope-logo.svg"
              alt="Mirascope Frog Logo"
              style={{
                height: logoStyles.fontSize,
                width: "auto",
              }}
            />
          </div>

          {/* Logo text */}
          <h1
            style={{
              fontSize: logoStyles.fontSize,
              marginBottom: 0,
              lineHeight: logoStyles.lineHeightMultiplier,
            }}
            className="font-handwriting text-mirascope-purple"
          >
            Mirascope
          </h1>
        </div>
      </div>
    </div>
  );
};

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
      {/* Container that centers the entire block in the viewport */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        {/* Content wrapper with computed negative margin to center the hero text */}
        <div
          className="flex flex-col items-center"
          style={{
            /* Use the shared calculated offset to center the hero text */
            marginTop: `calc(${logoStyles.centeringOffset} * -1)`,
          }}
        >
          <div
            data-fade-on-scroll="true"
            style={{
              marginBottom: logoStyles.logoToHeroSpacing,
              transition: "opacity 0.1s ease-out",
            }}
          >
            <LogoBanner />
          </div>

          <div className="text-center">
            <ResponsiveTextBlock
              lines={["The AI Engineer's", "Developer Stack"]}
              fontSize={styleSystem.heroFontSize}
              className="flex flex-col font-medium tracking-tight text-white"
              lineClassName="font-handwriting"
              textShadow={true}
              fadeOnScroll={true}
            />
          </div>
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
        fadeOnScroll={true}
      />
      <div
        className="bg-background/60 mb-10 w-full max-w-3xl rounded-md"
        data-fade-on-scroll="true"
        style={{
          transition: "opacity 0.1s ease-out",
        }}
      >
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
  // Initialize our global fade effect for elements with data-fade-on-scroll attribute
  useFadeOnScroll({
    fadeDistance: 120, // Distance from top at which fading starts (in px)
    fadeRange: 100, // Distance over which the fade occurs (in px)
  });

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
