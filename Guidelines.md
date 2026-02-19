# BEAN Design System Rules

This project uses a custom design system. The source of truth is:
- `tokens.json` — All design tokens (colors, spacing, typography, borders, shadows)
- `ui-manifest.json` — All component definitions with props, variants, and examples

## Critical Rules

1. **Always read `tokens.json` and `ui-manifest.json` before creating any component or UI**
2. **Never hardcode values for colors, spacing, shadows, etc.** — use CSS variables and Tailwind tokens defined in `tokens.json`
3. **Never invent components** — only use components defined in `ui-manifest.json`
4. **Match props exactly** — use the exact prop names and values from `ui-manifest.json`
5. **Never use external icons** — use only Font Awesome icons from the design system

## Token Usage

All styling must use Tailwind utility classes mapped from CSS variables in `tokens.json`:
- Colors (semantic only, never primitives): `text-primary`, `bg-surface`, `border-error`, `text-muted-foreground`
- Spacing (always `sp-` prefix): `p-sp-16`, `gap-sp-8`, `m-sp-24`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-input-focus`
- Border radius: `rounded-md`, `rounded-lg`
- Typography: `font-ubuntu font-medium` (H1-H2), `font-semibold` (H3-H5)

## Icons Usage

1. For buttons with dropdown — always use `fa-caret-down` on the right side
2. For select components — always use `fa-chevron-down` on the right side

## Component Usage

Import components individually from `@/components/ui/`:
```tsx
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
```

Check `ui-manifest.json` for:
1. Available components and their export names
2. Valid prop values (variant, size, colorScheme, etc.)
3. Usage examples

### Rules

1. **Always use full component configurations** — when using App Header, Sidebar Navigation, Filter Panel, Table, Page Header, or any shared UI component, use them with their complete default props and features as defined in the component showcases
2. **Do NOT simplify or strip features** — never create partial or stripped-down versions of existing components unless explicitly requested
3. **Showcase sync is mandatory** — when a component's logic or props change, its corresponding showcase in the design system library must be updated in the same task
4. **Use shared data/exports** — prefer existing shared data exports (e.g., `defaultMenuItems`, default filter configs) over hardcoded local copies
5. **Deviations only on request** — only change component structure, remove features, or use alternative patterns if the user explicitly asks

## Workflow

1. Read `tokens.json` and `ui-manifest.json` first
2. Build using only defined components and tokens
3. If something isn't in the design system, ask before creating it
