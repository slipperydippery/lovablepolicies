import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Ask", icon: "fa-comment-dots", to: "/app/mobile/chat" },
  { label: "Deliveries", icon: "fa-truck", to: "/app/mobile/purchases" },
  { label: "Profile", icon: "fa-user", to: "/app/mobile/profile" },
];

export default function MobileLayout() {
  return (
    <div className="min-h-screen flex justify-center bg-muted/30">
      <div className="relative flex flex-col w-full max-w-[430px] min-h-screen bg-background shadow-md">
        {/* Header */}
        <header className="flex items-center justify-between px-sp-16 h-14 border-b border-border shrink-0">
          <span className="font-heading font-medium text-foreground text-base">
            Policy Check
          </span>
          <NavLink
            to="/app"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-1" aria-hidden="true" />
            Switch role
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
