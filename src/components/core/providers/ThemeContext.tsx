import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

export type Theme = "light" | "dark" | "system";

// Simple theme API interface
interface ThemeAPI {
  // Current theme preference (light/dark/system)
  theme: Theme;
  // Actual theme being displayed (light/dark)
  current: "light" | "dark";
  // Set specific theme
  set: (theme: Theme) => void;
  // Whether the current page is the landing page
  isLandingPage: boolean;
}

// Create the context with default values
const ThemeContext = createContext<ThemeAPI>({
  theme: "system",
  current: "light",
  set: () => {},
  isLandingPage: false,
});

// Hook for components to use the theme
export function useTheme() {
  return useContext(ThemeContext);
}

// Hook specifically for landing page status
export function useIsLandingPage() {
  return useContext(ThemeContext).isLandingPage;
}

// Get stored theme preference from localStorage
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

// Determine effective theme based on preference and system settings
function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Apply theme to document
function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

interface ThemeProviderProps {
  children: ReactNode;
}

// Main theme provider for the application
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Theme preference (light/dark/system)
  const [theme, setTheme] = useState<Theme>("system");
  // Actual theme being applied (light/dark)
  const [current, setCurrent] = useState<"light" | "dark">("light");
  // Track if client-side code has run
  const [isHydrated, setIsHydrated] = useState(false);

  // Get router to determine if we're on the landing page
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = getStoredTheme();
    const effectiveTheme = getEffectiveTheme(savedTheme);

    setTheme(savedTheme);
    setCurrent(effectiveTheme);
    applyTheme(effectiveTheme);
    setIsHydrated(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const newTheme = getEffectiveTheme("system");
        setCurrent(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Update theme handler
  const setThemeHandler = (newTheme: Theme) => {
    const effectiveTheme = getEffectiveTheme(newTheme);

    // Update state
    setTheme(newTheme);
    setCurrent(effectiveTheme);

    // Apply to DOM
    applyTheme(effectiveTheme);

    // Store preference
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
  };

  // Don't render anything during SSR to avoid hydration mismatches
  if (!isHydrated) {
    return <>{children}</>;
  }

  // Add the data-landing-page attribute to the HTML element
  if (isHydrated && typeof document !== "undefined") {
    if (isLandingPage) {
      document.documentElement.setAttribute("data-landing-page", "true");
    } else {
      document.documentElement.removeAttribute("data-landing-page");
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        current,
        set: setThemeHandler,
        isLandingPage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Provider for Storybook usage
interface StorybookThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  initialCurrent?: "light" | "dark";
  isLandingPage?: boolean;
}

/**
 * A simplified theme provider for Storybook
 *
 * This provider doesn't manipulate the document directly as that doesn't
 * work well with Storybook's iframe-based component rendering. Instead,
 * we just provide the theme context and let ProductThemeDecorator handle
 * the DOM elements and styling.
 */
export function StorybookThemeProvider({
  children,
  initialTheme = "system",
  initialCurrent = "light",
  isLandingPage = false,
}: StorybookThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [current, setCurrent] = useState<"light" | "dark">(initialCurrent);

  // Theme switching handler - just update state
  const setThemeHandler = (newTheme: Theme) => {
    setTheme(newTheme);

    // In Storybook, we honor the requested theme directly rather than using system settings
    if (newTheme === "system") {
      // For "system" in Storybook, we keep the current theme
      return;
    }

    // Update the current theme
    setCurrent(newTheme as "light" | "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        current,
        set: setThemeHandler,
        isLandingPage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
