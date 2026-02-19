import * as React from "react";
import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/dropdown-menu";
import spendCloudLogo from "@/assets/spend-cloud-logo.svg";

const headerVariants = cva(
  "sticky top-0 z-50 w-full h-14 border-b transition-colors bg-primary text-primary-foreground border-primary/20"
);

export interface HeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Logo element or component */
  logo?: React.ReactNode;
  /** Title text displayed next to the logo */
  title?: string;
  /** Link destination when clicking the logo/title */
  to?: string;
  /** Content for the left slot (after logo/title) */
  left?: React.ReactNode;
  /** Content for the right slot */
  right?: React.ReactNode;
  /** Toggle button for mobile menu */
  toggle?: React.ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      logo,
      title,
      to = "/",
      left,
      right,
      toggle,
      ...props
    },
    ref
  ) => {
    const LogoWrapper = to ? "a" : "div";
    const logoWrapperProps = to ? { href: to } : {};

    return (
      <header
        ref={ref}
        className={cn(headerVariants(), className)}
        {...props}
      >
        <div className="flex h-full items-center justify-between pl-sp-16 md:pl-sp-24">
          {/* Left Section: Logo + Title + Left slot */}
          <div className="flex items-center gap-sp-16">
            {(logo || title) && (
              <LogoWrapper
                {...logoWrapperProps}
                className="flex items-center gap-sp-8 font-semibold text-lg hover:opacity-80 transition-opacity"
              >
                {logo}
                {title && <span>{title}</span>}
              </LogoWrapper>
            )}
            {left}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-sp-4">
            {right}
            {toggle && (
              <div className="md:hidden">
                {toggle}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

// Header Action Button component for consistent styling
const headerActionVariants = cva(
  "flex items-center gap-sp-8 px-sp-16 h-14 transition-colors text-sm font-medium cursor-pointer",
  {
    variants: {
      variant: {
        ghost: "hover:bg-white/10",
        solid: "bg-white/10 hover:bg-white/15",
        outline: "border border-current/20 hover:bg-white/10",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  }
);

export interface HeaderActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof headerActionVariants> {
  icon?: string;
  label?: string;
}

const HeaderAction = React.forwardRef<HTMLButtonElement, HeaderActionProps>(
  ({ className, variant, icon, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(headerActionVariants({ variant }), className)}
        {...props}
      >
        {icon && <i className={cn(icon, "w-4 text-center")} aria-hidden="true" />}
        {label && <span className="hidden sm:inline">{label}</span>}
        {children}
      </button>
    );
  }
);

HeaderAction.displayName = "HeaderAction";

// --- Shared default data & components ---

const defaultAdministrations = [
  "10001 - Acme Corporation",
  "10002 - Globex Industries",
  "10003 - Initech Systems",
  "10004 - Umbrella Holdings",
  "10005 - Wayne Enterprises",
  "10006 - Stark Solutions",
  "10007 - Hooli Technologies",
];

const AdministrationSelector = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(defaultAdministrations[0]);

  const filtered = defaultAdministrations.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <HeaderAction icon="fa-solid fa-building" label={selected} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={4}
          className={cn(
            "z-50 w-72 overflow-hidden rounded-lg border border-grey-200 bg-white shadow-md",
            "dark:border-grey-700 dark:bg-grey-800",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          <div className="flex items-center gap-sp-8 px-sp-16 py-sp-8 border-b border-grey-200 dark:border-grey-700">
            <i className="fa-solid fa-magnifying-glass text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search administration..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto py-sp-8">
            {filtered.length === 0 ? (
              <div className="px-sp-16 py-sp-8 text-sm text-muted-foreground text-center">
                No results found
              </div>
            ) : (
              filtered.map((admin) => (
                <button
                  key={admin}
                  type="button"
                  onClick={() => {
                    setSelected(admin);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center px-sp-16 py-sp-8 text-sm text-foreground transition-colors",
                    "hover:bg-grey-100 dark:hover:bg-grey-700",
                    selected === admin && "font-medium text-primary"
                  )}
                >
                  {admin}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

const defaultHelpItems: DropdownMenuItem[][] = [
  [
    { label: "DIRK Knowledge Base", icon: "fa-solid fa-book", onSelect: () => {} },
    { label: "DIRK Chat Help", icon: "fa-solid fa-comments", onSelect: () => {} },
    { label: "DIRK Success Center", icon: "fa-solid fa-graduation-cap", onSelect: () => {} },
  ],
];

const defaultUserMenuItems: DropdownMenuItem[][] = [
  [
    { label: "My Profile", icon: "fa-solid fa-user", onSelect: () => {} },
    { label: "Absence", icon: "fa-solid fa-calendar-xmark", onSelect: () => {} },
    { label: "Notes", icon: "fa-solid fa-note-sticky", onSelect: () => {} },
    { label: "My Subscription", icon: "fa-solid fa-bell", onSelect: () => {} },
  ],
  [
    { label: "System Notifications", icon: "fa-solid fa-bullhorn", onSelect: () => {} },
    { label: "Availability Report", icon: "fa-solid fa-chart-line", onSelect: () => {} },
    { label: "Release Notes", icon: "fa-solid fa-file-lines", onSelect: () => {} },
    { label: "About Us", icon: "fa-solid fa-circle-info", onSelect: () => {} },
  ],
  [
    { label: "Sign Out", icon: "fa-solid fa-right-from-bracket", color: "error" as const, onSelect: () => {} },
  ],
];

/** Fully composed right-side header actions with dropdowns */
const DefaultHeaderRight = () => (
  <>
    <DropdownMenu items={defaultHelpItems}>
      <HeaderAction icon="fa-solid fa-question" label="Ask DIRK" />
    </DropdownMenu>

    <AdministrationSelector />

    <DropdownMenu items={defaultUserMenuItems} align="end">
      <HeaderAction icon="fa-solid fa-user" label="Sandra de Wit" />
    </DropdownMenu>
  </>
);

export {
  Header,
  HeaderAction,
  headerVariants,
  headerActionVariants,
  AdministrationSelector,
  DefaultHeaderRight,
  defaultHelpItems,
  defaultUserMenuItems,
  defaultAdministrations,
};
