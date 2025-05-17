import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/src/components/ui/dropdown-menu";
import { useTheme, useIsLandingPage, type Theme } from "@/src/components/core/providers";
import { THEME_SWITCHER_STYLES } from "./styles";

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
        <button className={THEME_SWITCHER_STYLES.trigger} aria-label="Select theme">
          {theme === "light" && <Sun size={20} />}
          {theme === "dark" && <Moon size={20} />}
          {theme === "system" && <Monitor size={20} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={THEME_SWITCHER_STYLES.content(isLandingPage)} align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => handleThemeChange(value as Theme)}
        >
          <DropdownMenuRadioItem value="light" className={THEME_SWITCHER_STYLES.radioItem}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className={THEME_SWITCHER_STYLES.radioItem}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className={THEME_SWITCHER_STYLES.radioItem}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
