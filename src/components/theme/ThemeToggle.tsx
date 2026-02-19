import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <div className="flex items-center gap-sp-8">
      {/* Simple Toggle Button */}
      <button
        onClick={toggleTheme}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-md",
          "bg-muted hover:bg-muted/80 text-foreground",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Toggle theme"
      >
        {/* Sun icon - shown in dark mode */}
        <i
          className={cn(
            "fa-solid fa-sun absolute transition-all",
            resolvedTheme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          )}
          aria-hidden="true"
        />
        {/* Moon icon - shown in light mode */}
        <i
          className={cn(
            "fa-solid fa-moon transition-all",
            resolvedTheme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-0"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Theme Cycle Indicator */}
      <div className="flex items-center gap-sp-4 text-xs text-muted-foreground">
        <button
          onClick={cycleTheme}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors",
            theme === "system"
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted"
          )}
        >
          <i className="fa-solid fa-desktop mr-1" aria-hidden="true" />
          System
        </button>
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors",
            theme === "light"
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted"
          )}
        >
          <i className="fa-solid fa-sun mr-1" aria-hidden="true" />
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors",
            theme === "dark"
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted"
          )}
        >
          <i className="fa-solid fa-moon mr-1" aria-hidden="true" />
          Dark
        </button>
      </div>
    </div>
  );
}
