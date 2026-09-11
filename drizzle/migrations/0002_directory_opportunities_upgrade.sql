ALTER TABLE public.business_contacts
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_locked boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  opportunity_type text NOT NULL,
  location text NOT NULL DEFAULT 'Kanyakumari',
  description text NOT NULL DEFAULT '',
  business_id uuid REFERENCES public.business_contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  potential_value text,
  contact_locked boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'available',
  premium_only boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opps public read" ON public.opportunities
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "opps admin write" ON public.opportunities
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS opportunities_category_idx ON public.opportunities (category);
CREATE INDEX IF NOT EXISTS opportunities_created_idx ON public.opportunities (created_at DESC);

CREATE OR REPLACE FUNCTION public.reveal_business_contact(_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE uid uuid := auth.uid(); ph text; plan_code text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  SELECT p.code INTO plan_code FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
   WHERE s.user_id = uid AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1;
  IF plan_code IS NULL AND NOT public.is_admin(uid) THEN
    INSERT INTO public.contact_access_logs (user_id, business_contact_id, action, status)
    VALUES (uid, _business_id, 'view_business_contact', 'denied');
    RETURN jsonb_build_object('error','no_active_subscription');
  END IF;
  SELECT phone INTO ph FROM public.business_contacts WHERE id = _business_id;
  INSERT INTO public.contact_access_logs (user_id, business_contact_id, action, plan_code, status)
  VALUES (uid, _business_id, 'view_business_contact', plan_code, 'allowed');
  IF ph IS NULL OR ph = '' THEN RETURN jsonb_build_object('error','contact_not_published'); END IF;
  RETURN jsonb_build_object('phone', ph);
END; $$;