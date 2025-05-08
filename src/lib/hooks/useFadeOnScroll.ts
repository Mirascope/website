import { useEffect } from "react";

interface FadeOptions {
  fadeDistance?: number; // Distance from top at which fading starts (in px)
  fadeRange?: number; // Distance over which the fade occurs (in px)
  selector?: string; // CSS selector for elements to fade
}

/**
 * Global hook to fade elements as they approach the top of the viewport
 *
 * @param options Configuration options for the fade effect
 * @param options.fadeDistance Distance from top at which fading starts (default: 200px)
 * @param options.fadeRange Distance over which the fade occurs (default: 150px)
 * @param options.selector CSS selector for elements to fade (default: '[data-fade-on-scroll]')
 */
export function useFadeOnScroll({
  fadeDistance = 200,
  fadeRange = 150,
  selector = "[data-fade-on-scroll]",
}: FadeOptions = {}) {
  useEffect(() => {
    // Function to calculate and apply opacity based on element position
    const updateElementOpacity = () => {
      // Get all elements with the fade-on-scroll data attribute
      const elements = document.querySelectorAll<HTMLElement>(selector);

      // If no scroll has happened yet, ensure everything is fully visible
      if (window.scrollY === 0) {
        elements.forEach((element) => {
          element.style.opacity = "1";
        });
        return;
      }

      elements.forEach((element) => {
        // Check for custom fade settings on the element
        const elementFadeDistance = parseFloat(
          element.dataset.fadeDistance || fadeDistance.toString()
        );
        const elementFadeRange = parseFloat(element.dataset.fadeRange || fadeRange.toString());

        const rect = element.getBoundingClientRect();

        // Calculate how far into the fade range we are
        if (rect.top <= elementFadeDistance) {
          // We're in the fading zone
          const distanceIntoFadeZone = elementFadeDistance - rect.top;
          const fadePercentage = distanceIntoFadeZone / elementFadeRange;

          // Clamp opacity between 0 and 1
          const opacity = Math.max(0, Math.min(1, 1 - fadePercentage));
          element.style.opacity = opacity.toString();

          // Debug output for important opacity changes (uncomment if needed)
          // console.debug(`Element opacity: ${finalOpacity.toFixed(2)}, top: ${rect.top}px, distance: ${elementFadeDistance}px`);
        } else {
          // We're above the fade start point, so maintain full opacity
          element.style.opacity = "1";
        }
      });
    };

    // Throttle function to limit execution frequency
    const throttle = (callback: Function, limit: number) => {
      let waiting = false;
      return function () {
        if (!waiting) {
          callback();
          waiting = true;
          setTimeout(() => {
            waiting = false;
          }, limit);
        }
      };
    };

    // Create a throttled version of our update function (16ms ≈ 60fps)
    const throttledUpdate = throttle(updateElementOpacity, 16);

    // Need to wait for DOM to be ready before initial calculation
    if (document.readyState === "complete") {
      updateElementOpacity();
    } else {
      window.addEventListener("load", updateElementOpacity);
    }

    // Add scroll event listener
    window.addEventListener("scroll", throttledUpdate);

    // Also update on resize since viewport dimensions might change
    window.addEventListener("resize", throttledUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", throttledUpdate);
      window.removeEventListener("resize", throttledUpdate);
      window.removeEventListener("load", updateElementOpacity);
    };
  }, [fadeDistance, fadeRange, selector]);
}

/**
 * Helper function to apply fade attributes to an element
 */
export function applyFadeStyles(element: HTMLElement | null, options: FadeOptions = {}) {
  if (!element) return;

  // Default values
  const { fadeDistance = 200, fadeRange = 150 } = options;

  // Apply necessary styles
  element.style.transition = "opacity 0.1s ease-out";

  // Mark element for the global fade handler
  element.dataset.fadeOnScroll = "true";

  // Optionally store custom fade values as data attributes
  element.dataset.fadeDistance = fadeDistance.toString();
  element.dataset.fadeRange = fadeRange.toString();
}
