import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { label: t("adminLayout.nav.policyHub"), icon: "fa-book", to: "/app/admin/policy-hub" },
    { label: t("adminLayout.nav.validation"), icon: "fa-clipboard-check", to: "/app/admin/validation" },
    { label: t("adminLayout.nav.budget"), icon: "fa-coins", to: "/app/admin/budget" },
    { label: t("adminLayout.nav.insights"), icon: "fa-chart-line", to: "/app/admin/insights" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex flex-col w-[240px] shrink-0 bg-grey-100 text-foreground border-r border-border">
        {/* Logo area */}
        <div className="flex items-center gap-sp-12 px-sp-16 h-14 border-b border-border">
          <img src="/botchie-logo.svg" alt="Botchie" className="h-6 w-6" />
          <span className="font-heading font-medium text-sm">Botchie</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col py-sp-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-sp-12 px-sp-16 h-[50px] text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <i
                  className={cn(
                    "fa-solid w-5 text-center text-base",
                    item.icon,
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer link */}
        <div className="px-sp-16 py-sp-12 border-t border-border">
          <NavLink
            to="/app/mobile/chat"
            className="flex items-center gap-sp-8 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fa-solid fa-mobile-screen text-sm" aria-hidden="true" />
            {t("adminLayout.switchMobile")}
          </NavLink>
          <NavLink
            to="/app"
            className="flex items-center gap-sp-8 text-xs text-muted-foreground hover:text-primary transition-colors mt-sp-8"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
            {t("adminLayout.roleSwitcher")}
          </NavLink>
          <div className="mt-sp-8">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-sp-24 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
