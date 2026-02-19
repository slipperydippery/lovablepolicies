
-- Create policies table
CREATE TABLE public.policies (
  id text PRIMARY KEY,
  name text NOT NULL,
  ledger text,
  status text NOT NULL DEFAULT 'draft',
  benchmark_score text,
  benchmark_warning boolean DEFAULT false,
  valid_until text,
  intent text,
  max_amount text,
  allowed_categories text,
  afas_code integer,
  start_date text,
  end_date text,
  limit_amount integer DEFAULT 0,
  friction text,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- No RLS for now (admin-only, no auth yet)
-- TODO: Enable RLS once authentication is implemented
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (no auth)
CREATE POLICY "Allow all access to policies" ON public.policies FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_policies_updated_at();
