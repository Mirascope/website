import { SEOMeta } from "@/src/components/";
import { useSunsetTime } from "@/src/lib/hooks/useSunsetTime";
import { useGradientFadeOnScroll } from "@/src/lib/hooks/useGradientFadeOnScroll";
import { useRef, useState, useEffect } from "react";
import { ProviderContextProvider } from "@/src/components/core/providers/ProviderContext";
import { HeroBlock } from "./HeroBlock";
import { MirascopeBlock } from "./MirascopeBlock";
import { LilypadBlock } from "./LilypadBlock";

export function LandingPage() {
  useSunsetTime();
  useGradientFadeOnScroll({ fadeStartDistance: 120, fadeEndDistance: 0 });

  const heroSectionRef = useRef<HTMLDivElement>(null);
  const mirascopeSectionRef = useRef<HTMLDivElement>(null);
  const lilypadSectionRef = useRef<HTMLDivElement>(null);

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
      <ProviderContextProvider>
        <div className="flex w-full flex-col">
          {/* Hero section */}
          <div data-gradient-fade={true} ref={heroSectionRef}>
            <HeroBlock
              onScrollDown={scrollToMirascopeSection}
              showScrollButton={showScrollButton}
            />
          </div>

          {/* Mirascope section */}
          <div data-gradient-fade={true} ref={mirascopeSectionRef}>
            <MirascopeBlock />
          </div>

          {/* Lilypad section */}
          <div data-gradient-fade={true} ref={lilypadSectionRef}>
            <LilypadBlock />
          </div>
        </div>
      </ProviderContextProvider>
    </>
  );
}
