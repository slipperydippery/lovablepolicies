import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MobileLayout() {
  const { t } = useTranslation();

  const tabs = [
    { label: t("mobileLayout.tabs.ask"), icon: "fa-comment-dots", to: "/app/mobile/chat" },
    { label: t("mobileLayout.tabs.deliveries"), icon: "fa-truck", to: "/app/mobile/purchases" },
    { label: t("mobileLayout.tabs.profile"), icon: "fa-user", to: "/app/mobile/profile" },
  ];
  return (
    <div className="min-h-screen flex justify-center bg-muted/30">
      <div className="relative flex flex-col w-full max-w-[430px] min-h-screen bg-background shadow-md">
        {/* Header */}
        <header className="flex items-center justify-between px-sp-16 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-sp-8">
            <img src="/botchie-logo.svg" alt="Botchie" className="h-6 w-6" />
            <span className="font-heading font-medium text-foreground text-base">Botchie</span>
          </div>
          <LanguageSwitcher />
          <NavLink
            to="/app"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-1" aria-hidden="true" />
            {t("mobileLayout.switchRole")}
          </NavLink>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav className="flex items-center justify-around border-t border-border bg-background h-16 shrink-0">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 text-xs transition-colors py-2 px-3",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <i className={`fa-solid ${tab.icon} text-lg`} aria-hidden="true" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
