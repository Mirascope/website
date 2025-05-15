import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { useTheme, useIsLandingPage, type Theme } from "@/src/components/core/providers";

export default function ThemeSwitcher() {
  const { theme, current, set: setTheme } = useTheme();
  const isLandingPage = useIsLandingPage();

  const handleThemeChange = (newTheme: Theme) => {
    // Get current effective theme before change for transition effect
    const prevEffectiveTheme = current;

    // Set the new theme through the context
    setTheme(newTheme);

    // For theme changes on homepage, update the background transition
    if (isLandingPage && prevEffectiveTheme !== (newTheme === "system" ? current : newTheme)) {
      document.body.style.transition = "background-image 0.3s ease";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "focus:ring-primary mr-2 cursor-pointer rounded-md p-2 transition-colors focus:ring-2 focus:outline-none",
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
      <DropdownMenuContent className={cn(isLandingPage && "textured-bg-absolute")} align="end">
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
