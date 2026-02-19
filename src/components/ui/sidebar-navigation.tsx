import * as React from "react";
import { cn } from "@/lib/utils";

export interface VerticalMenuSubItemDef {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface VerticalMenuItemDef {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
  children?: VerticalMenuSubItemDef[];
}

export interface VerticalMenuProps {
  items: VerticalMenuItemDef[];
  collapsed?: boolean;
  onCollapse?: () => void;
  className?: string;
}

export const defaultMenuItems: Omit<VerticalMenuItemDef, 'active' | 'onClick'>[] = [
  {
    label: "Contract management",
    icon: "fa-handshake",
    children: [
      { label: "Add", icon: "fa-circle-plus" },
      { label: "Mailbox", icon: "fa-inbox" },
      { label: "Register", icon: "fa-pencil" },
      { label: "Disapproved", icon: "fa-circle-xmark" },
      { label: "Actions", icon: "fa-square-check" },
      { label: "Price changes", icon: "fa-chart-line" },
      { label: "Archive", icon: "fa-box-archive" },
      { label: "Progress", icon: "fa-list-check" },
      { label: "Statistics", icon: "fa-chart-pie" },
    ],
  },
  {
    label: "Expense claim",
    icon: "fa-pencil",
    children: [
      { label: "Expense claims", icon: "fa-pencil" },
      { label: "Archive", icon: "fa-box-archive" },
      { label: "Assess", icon: "fa-gavel" },
      { label: "Progress", icon: "fa-list-check" },
      { label: "Addresses", icon: "fa-location-pin" },
      { label: "Verify", icon: "fa-eye" },
      { label: "Favorites", icon: "fa-star" },
      { label: "Export", icon: "fa-upload" },
    ],
  },
  {
    label: "Invoice processing",
    icon: "fa-file-invoice",
    children: [
      { label: "Export mapping", icon: "fa-file-export" },
      { label: "Customer exportmapping", icon: "fa-users" },
      { label: "Mailbox", icon: "fa-inbox" },
      { label: "Procuration", icon: "fa-stamp" },
      { label: "Templates", icon: "fa-copy" },
      { label: "XML mapping", icon: "fa-code" },
      { label: "Optimization", icon: "fa-sliders" },
      { label: "Peppol", icon: "fa-paper-plane" },
      { label: "Autosuggest statistics", icon: "fa-chart-bar" },
    ],
  },
  {
    label: "Procurement",
    icon: "fa-cart-shopping",
    children: [
      { label: "Requests", icon: "fa-shopping-basket" },
      { label: "Favorites", icon: "fa-star" },
      { label: "Shopping cart", icon: "fa-shopping-cart" },
      { label: "Orders", icon: "fa-file-lines" },
      { label: "Archive", icon: "fa-box-archive" },
      { label: "Assess", icon: "fa-gavel" },
      { label: "Suppliers", icon: "fa-users" },
      { label: "Deliveries", icon: "fa-inbox" },
      { label: "Shipments", icon: "fa-truck" },
      { label: "Encode", icon: "fa-pencil" },
      { label: "Progress", icon: "fa-list-check" },
      { label: "In transit", icon: "fa-road" },
      { label: "Complete", icon: "fa-check" },
      { label: "Statistics", icon: "fa-chart-pie" },
    ],
  },
  {
    label: "Cash & Card",
    icon: "fa-credit-card",
    children: [
      { label: "Entries", icon: "fa-pencil" },
      { label: "Cards", icon: "fa-credit-card" },
      { label: "Import", icon: "fa-download" },
      { label: "Cooperative encoding", icon: "fa-list" },
      { label: "Batch close", icon: "fa-lock" },
      { label: "Charge", icon: "fa-credit-card" },
      { label: "Withdrawals", icon: "fa-money-bill" },
      { label: "Advances", icon: "fa-cubes" },
      { label: "Assess", icon: "fa-gavel" },
      { label: "Archive", icon: "fa-archive" },
      { label: "Progress", icon: "fa-list-check" },
      { label: "Export", icon: "fa-upload" },
    ],
  },
  {
    label: "Commitments",
    icon: "fa-thumbtack",
    children: [
      { label: "Commitments", icon: "fa-thumbtack" },
    ],
  },
  {
    label: "Analysis",
    icon: "fa-chart-pie",
    children: [
      { label: "ABC", icon: "fa-pencil" },
      { label: "Audit", icon: "fa-credit-card" },
      { label: "Creditor overview", icon: "fa-download" },
      { label: "Geographical spread", icon: "fa-list" },
      { label: "Growth relations", icon: "fa-lock" },
      { label: "Invoice methods", icon: "fa-credit-card" },
      { label: "Kraljic matrix", icon: "fa-money-bill" },
      { label: "Product group overview", icon: "fa-cubes" },
      { label: "Purchase volume", icon: "fa-gavel" },
      { label: "Top 25 Spend", icon: "fa-archive" },
    ],
  },
  {
    label: "Application management",
    icon: "fa-gear",
    children: [
      { label: "Organization", icon: "fa-building" },
      { label: "General", icon: "fa-wrench" },
      { label: "Analysis", icon: "fa-chart-line" },
      { label: "Contract management", icon: "fa-handshake" },
      { label: "Expense claims", icon: "fa-pencil" },
      { label: "Invoice processing", icon: "fa-stamp" },
      { label: "Procurement", icon: "fa-shopping-cart" },
      { label: "Cash and Card", icon: "fa-credit-card" },
      { label: "Configuration settings", icon: "fa-cog" },
    ],
  },
];

export function VerticalMenu({ items, collapsed, onCollapse, className }: VerticalMenuProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const hoveredItem = hoveredIndex !== null ? items[hoveredIndex] : null;
  const showSubPanel = hoveredItem?.children && hoveredItem.children.length > 0 && (!hoveredItem.active || collapsed);

  return (
    <div className="relative h-full" onMouseLeave={() => setHoveredIndex(null)}>
      <div className={cn("flex flex-col bg-grey-800 h-full", collapsed ? "w-[50px]" : "w-[234px]", className)}>
        <div className="flex flex-col flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-grey-700 hover:[&::-webkit-scrollbar-thumb]:bg-grey-600" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--grey-700)) transparent' }}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <button
                onClick={item.onClick}
                onMouseEnter={() => setHoveredIndex(index)}
                className={cn(
                  "group flex items-center px-sp-16 gap-sp-16 w-full min-h-[50px] h-[50px] shrink-0 transition-colors",
                  collapsed && "justify-center",
                  item.active
                    ? "text-white bg-grey-900"
                    : "text-grey-500 hover:text-primary"
                )}
              >
                <i
                  className={cn(
                    "fa-solid w-5 h-5 flex items-center justify-center text-base",
                    item.icon,
                    item.active
                      ? "text-white"
                      : "text-grey-700 group-hover:text-primary"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-xs font-semibold leading-5 truncate">
                      {item.label}
                    </span>
                    <i
                      className={cn(
                        "fa-solid text-xs",
                        item.active
                          ? "fa-chevron-down text-white"
                          : "fa-chevron-right text-grey-500 group-hover:text-primary"
                      )}
                    />
                  </>
                )}
              </button>
              {!collapsed && item.active && item.children && item.children.length > 0 && (
                <div className="flex flex-col bg-grey-900">
                  {item.children.map((sub, subIndex) => (
                    <button
                      key={subIndex}
                      onClick={sub.onClick}
                      className="group flex items-center px-sp-16 gap-sp-16 w-full min-h-[50px] h-[50px] shrink-0 transition-colors"
                    >
                      {sub.icon ? (
                        <i
                          className={cn(
                            "fa-solid w-5 h-5 flex items-center justify-center text-base",
                            sub.icon,
                            sub.active ? "text-white" : "text-grey-700 group-hover:text-primary"
                          )}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "flex-1 text-left text-xs font-semibold leading-5 truncate",
                          sub.active ? "text-white" : "text-grey-500 group-hover:text-primary",
                          !sub.icon && "pl-[48px]"
                        )}
                      >
                        {sub.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {onCollapse && (
          <div className={cn("flex items-center px-sp-16 min-h-[50px] h-[50px] shrink-0", collapsed ? "justify-center" : "justify-end")}>
            <button onClick={onCollapse} className="text-grey-500 hover:text-primary transition-colors">
              <i className={cn("fa-solid text-xs", collapsed ? "fa-chevron-right" : "fa-chevron-left")} />
            </button>
          </div>
        )}
      </div>

      {showSubPanel && (
        <div className="absolute left-full top-0 flex flex-col bg-grey-900 h-full w-[224px] z-30">
          {hoveredItem.children!.map((sub, index) => (
            <button
              key={index}
              onClick={sub.onClick}
              className="group flex items-center px-sp-16 gap-sp-16 w-full min-h-[50px] h-[50px] shrink-0 transition-colors"
            >
              {sub.icon ? (
                <i
                  className={cn(
                    "fa-solid w-5 h-5 flex items-center justify-center text-base text-grey-700 group-hover:text-primary",
                    sub.icon
                  )}
                />
              ) : null}
              <span className={cn(
                "flex-1 text-left text-xs font-semibold leading-5 truncate text-grey-500 group-hover:text-primary",
                !sub.icon && "pl-[48px]"
              )}>
                {sub.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
