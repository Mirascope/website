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

// Pure functions for theme management
const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
};

const storeTheme = (theme: Theme): void => {
  localStorage.setItem("theme", theme);
};

const getEffectiveTheme = (theme: Theme): "light" | "dark" => {
  if (theme !== "system") return theme;

  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  const effectiveTheme = getEffectiveTheme(theme);

  root.classList.remove("light", "dark");
  root.classList.add(effectiveTheme);
};

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    storeTheme(newTheme);

    if (mounted) {
      const prevEffectiveTheme = getEffectiveTheme(theme);
      const newEffectiveTheme = getEffectiveTheme(newTheme);

      applyTheme(newTheme);

      // For theme changes on homepage, update the background transition
      if (isLandingPage && prevEffectiveTheme !== newEffectiveTheme) {
        document.body.style.transition = "background-image 0.3s ease";
      }
    }
  };

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
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
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => handleThemeChange(value as Theme)}
        >
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
