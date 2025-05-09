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
  useGradientFadeOnScroll({ fadeStartDistance: 100, fadeEndDistance: 10 });

  const heroSectionRef = useRef<HTMLDivElement>(null);
  const mirascopeSectionRef = useRef<HTMLDivElement>(null);
  const lilypadSectionRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(true);

  // Function to scroll to mirascope section with offset for better positioning
  const scrollToMirascopeSection = () => {
    if (mirascopeSectionRef.current) {
      const yOffset = -window.innerHeight * 0.05;
      const element = mirascopeSectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Function to scroll to lilypad section with offset for better positioning
  const scrollToLilypadSection = () => {
    if (lilypadSectionRef.current) {
      const yOffset = -window.innerHeight * 0;
      const element = lilypadSectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    }
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
          <div data-gradient-fade={true} ref={mirascopeSectionRef} className="mb-24">
            <MirascopeBlock onScrollDown={scrollToLilypadSection} />
          </div>

          {/* Lilypad section */}
          <div data-gradient-fade={true} ref={lilypadSectionRef} className="mt-24">
            <LilypadBlock />
          </div>
        </div>
      </ProviderContextProvider>
    </>
  );
}
