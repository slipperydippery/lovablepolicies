import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Policy Hub", icon: "fa-book", to: "/app/admin/policy-hub" },
  { label: "Supervisor Validation", icon: "fa-clipboard-check", to: "/app/admin/validation" },
  { label: "Budget Overview", icon: "fa-coins", to: "/app/admin/budget" },
  { label: "Policy Health & Insights", icon: "fa-chart-line", to: "/app/admin/insights" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex flex-col w-[240px] shrink-0 bg-grey-100 text-foreground border-r border-border">
        {/* Logo area */}
        <div className="flex items-center gap-sp-12 px-sp-16 h-14 border-b border-border">
          <i className="fa-solid fa-shield-halved text-primary text-lg" aria-hidden="true" />
          <span className="font-heading font-medium text-sm">Policy Admin</span>
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
            Switch to Mobile View
          </NavLink>
          <NavLink
            to="/app"
            className="flex items-center gap-sp-8 text-xs text-muted-foreground hover:text-primary transition-colors mt-sp-8"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
            Role Switcher
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-sp-24 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
