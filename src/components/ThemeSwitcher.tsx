import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { useRouterState } from "@tanstack/react-router";

type Theme = "light" | "dark" | "system";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  // Initialize theme state from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("system");
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;

    // Store previous theme for comparison
    const prevTheme = localStorage.getItem("theme") || "system";

    // Clear previous theme classes only
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    // Apply current theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Store the current theme
    localStorage.setItem("theme", theme);

    // For theme changes on homepage, update the background without reloading
    if (isLandingPage && prevTheme !== theme) {
      // Instead of reloading, dynamically update the background
      document.body.style.transition = "background-image 0.3s ease";
    }
  }, [theme, mounted, isLandingPage]);

  // Add listener for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "focus:ring-primary mr-2 rounded-md p-2 transition-colors focus:ring-2 focus:outline-none",
            isLandingPage ? "nav-icon-landing" : "nav-text-regular"
          )}
          aria-label="Select theme"
        >
          {theme === "light" && <Sun size={20} className={cn(isLandingPage && "icon-shadow")} />}
          {theme === "dark" && <Moon size={20} className={cn(isLandingPage && "icon-shadow")} />}
          {theme === "system" && (
            <Monitor size={20} className={cn(isLandingPage && "icon-shadow")} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
