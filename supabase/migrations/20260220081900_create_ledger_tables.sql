-- Create ledger_categories table
CREATE TABLE public.ledger_categories (
  id text PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  total_budget integer NOT NULL,
  location_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sub_ledgers table
CREATE TABLE public.sub_ledgers (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES public.ledger_categories(id) ON DELETE CASCADE,
  code integer NOT NULL,
  name text NOT NULL,
  budget integer NOT NULL,
  spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- No RLS for now (admin-only, no auth yet)
ALTER TABLE public.ledger_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ledger_categories" ON public.ledger_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sub_ledgers" ON public.sub_ledgers FOR ALL USING (true) WITH CHECK (true);

-- Seed data for loc-002 (De VeldKeur — default location)
INSERT INTO public.ledger_categories (id, code, name, total_budget, location_id) VALUES
  ('cat-002', '1', '1. FOOD, BEVERAGES & KITCHEN', 1800000, 'loc-002'),
  ('cat-001', '3', '3. CARE & TREATMENT', 3500000, 'loc-002');

INSERT INTO public.sub_ledgers (id, category_id, code, name, budget, spent) VALUES
  ('sl-010', 'cat-002', 4110, 'Nutrition', 900000, 680000),
  ('sl-011', 'cat-002', 4120, 'Meals provided by third parties', 550000, 420000),
  ('sl-012', 'cat-002', 4130, 'Beverages & Snacks', 350000, 210000),
  ('sl-001', 'cat-001', 4310, 'Incontinence Materials', 1200000, 1100000),
  ('sl-003', 'cat-001', 4330, 'Medical Aids', 800000, 750000),
  ('sl-004', 'cat-001', 4340, 'Recreation (Activities & Wellbeing)', 500000, 625000);
