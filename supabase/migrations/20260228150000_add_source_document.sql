-- Add source_document column to track which document(s) a policy was extracted from
ALTER TABLE public.policies ADD COLUMN source_document text;
