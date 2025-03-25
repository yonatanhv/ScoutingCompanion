import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Get current system theme to show correct state when in system mode
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  let title;
  if (theme === "light") title = "Switch to dark mode";
  else if (theme === "dark") title = "Switch to system theme";
  else title = "Switch to light mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full transition-all duration-200 hover:bg-opacity-20"
      title={title}
    >
      {theme === "light" && (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
      )}
      {theme === "dark" && (
        <Monitor className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
      )}
      {theme === "system" && (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
      )}
      <span className="sr-only">Toggle theme ({theme})</span>
    </Button>
  );
}