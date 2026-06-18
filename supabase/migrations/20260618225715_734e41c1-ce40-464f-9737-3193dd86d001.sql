ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS report_card_template_id text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS report_card_title text NOT NULL DEFAULT 'STUDENT TERMLY REPORT CARD',
  ADD COLUMN IF NOT EXISTS report_card_footer_note text NOT NULL DEFAULT 'NB: DO NOT JUDGE YOUR CHILD/CHILDREN PERFORMANCE BASED ON POSITION BUT ON AVERAGE',
  ADD COLUMN IF NOT EXISTS report_card_tagline text;

ALTER TABLE public.school_settings
  DROP CONSTRAINT IF EXISTS school_settings_report_card_template_id_check;
ALTER TABLE public.school_settings
  ADD CONSTRAINT school_settings_report_card_template_id_check
  CHECK (report_card_template_id IN ('classic','modern','compact'));