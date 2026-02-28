import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("nl") ? "nl" : "en";

  return (
    <div className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("nl")}
        className={cn(
          "px-1.5 py-0.5 rounded transition-colors font-semibold",
          current === "nl"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        NL
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("en")}
        className={cn(
          "px-1.5 py-0.5 rounded transition-colors font-semibold",
          current === "en"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
