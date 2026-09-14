ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_user_idx ON public.phone_otps (user_id, created_at DESC);

GRANT ALL ON public.phone_otps TO service_role;

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no client access to phone otps" ON public.phone_otps;
CREATE POLICY "no client access to phone otps" ON public.phone_otps
  FOR SELECT TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.is_phone_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT phone_verified FROM public.profiles WHERE id = _user_id), false)
$$;

CREATE OR REPLACE FUNCTION public.start_subscription(_plan_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  p public.plans%ROWTYPE;
  occupied int; sub_id uuid; q jsonb; is_first boolean;
  is_bank boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.is_phone_verified(uid) THEN RETURN jsonb_build_object('error','phone_not_verified'); END IF;
  SELECT * INTO p FROM public.plans WHERE code = _plan_code AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','plan_not_found'); END IF;

  is_bank := public.has_role(uid,'bank_executive') OR public.has_role(uid,'premium_bank_executive');
  IF is_bank AND NOT p.bank_executive_eligible THEN
    RETURN jsonb_build_object('error','plan_not_available_for_bank_executive');
  END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = uid AND status IN ('active','pending')) THEN
    RETURN jsonb_build_object('error','subscription_already_exists');
  END IF;

  IF p.slot_limit IS NOT NULL THEN
    SELECT count(*) INTO occupied FROM public.subscriptions s WHERE s.plan_id = p.id AND s.status IN ('active','pending');
    IF occupied >= p.slot_limit THEN RETURN jsonb_build_object('error','slots_full'); END IF;
  END IF;

  is_first := NOT EXISTS (SELECT 1 FROM public.payments WHERE user_id = uid AND status = 'success');
  q := public.quote_for_plan(p.code, is_first);

  INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (uid, p.id, 'pending') RETURNING id INTO sub_id;
  INSERT INTO public.payments (user_id, subscription_id, base_amount, discount, gst, application_fee, total_amount, status)
  VALUES (uid, sub_id, (q->>'base_amount')::numeric, (q->>'discount')::numeric, (q->>'gst')::numeric,
          (q->>'application_fee')::numeric, (q->>'total_amount')::numeric, 'created');
  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (uid, 'Subscription created', 'Your ' || p.name || ' subscription is pending payment verification.', 'info');
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, meta)
  VALUES (uid, 'subscription.start', 'subscriptions', sub_id::text, q);

  RETURN jsonb_build_object('subscription_id', sub_id, 'status', 'pending', 'quote', q);
END; $function$;

CREATE OR REPLACE FUNCTION public.reveal_lead_contact(_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); ph text; code text; plan_code text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.is_phone_verified(uid) AND NOT public.is_admin(uid) THEN
    RETURN jsonb_build_object('error','phone_not_verified');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lead_allocations WHERE lead_id = _lead_id AND user_id = uid)
     AND NOT public.is_admin(uid) THEN
    INSERT INTO public.contact_access_logs (user_id, lead_id, action, status) VALUES (uid,_lead_id,'view_contact','denied');
    RETURN jsonb_build_object('error','not_allocated');
  END IF;
  SELECT p.code INTO plan_code FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
   WHERE s.user_id = uid AND s.status='active' ORDER BY s.created_at DESC LIMIT 1;
  SELECT phone, lead_code INTO ph, code FROM public.leads WHERE id = _lead_id;
  INSERT INTO public.contact_access_logs (user_id, lead_id, action, plan_code, status)
  VALUES (uid, _lead_id, 'view_contact', plan_code, 'allowed');
  RETURN jsonb_build_object('phone', ph, 'lead_code', code);
END; $function$;

CREATE OR REPLACE FUNCTION public.reveal_business_contact(_business_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); ph text; plan_code text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.is_phone_verified(uid) AND NOT public.is_admin(uid) THEN
    RETURN jsonb_build_object('error','phone_not_verified');
  END IF;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.claim_leads()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid(); s public.subscriptions%ROWTYPE; p public.plans%ROWTYPE;
  wk text := to_char(now(),'IYYY-IW'); used_attempts int := 0; remaining int; n int; got int;
  codes jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.is_phone_verified(uid) THEN RETURN jsonb_build_object('error','phone_not_verified'); END IF;
  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid AND status = 'active' ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  SELECT * INTO p FROM public.plans WHERE id = s.plan_id;

  SELECT COALESCE(attempt_count,0) INTO used_attempts FROM public.lead_attempts WHERE user_id = uid AND week_identifier = wk;
  IF COALESCE(used_attempts,0) >= p.weekly_attempt_limit THEN
    RETURN jsonb_build_object('error','weekly_attempt_used');
  END IF;

  remaining := p.lead_limit - s.leads_used;
  IF remaining <= 0 THEN RETURN jsonb_build_object('error','lead_limit_reached'); END IF;
  n := LEAST(p.leads_per_attempt, remaining);

  WITH candidate AS (
    SELECT l.id FROM public.leads l
    WHERE NOT EXISTS (SELECT 1 FROM public.lead_allocations la WHERE la.lead_id = l.id AND la.user_id = uid)
    ORDER BY l.created_at
    LIMIT n
  ), ins AS (
    INSERT INTO public.lead_allocations (lead_id, user_id, plan_id)
    SELECT id, uid, p.id FROM candidate
    ON CONFLICT (lead_id, user_id) DO NOTHING
    RETURNING lead_id
  )
  SELECT count(*)::int, COALESCE(jsonb_agg(l.lead_code), '[]'::jsonb) INTO got, codes
  FROM ins JOIN public.leads l ON l.id = ins.lead_id;

  IF COALESCE(got,0) = 0 THEN RETURN jsonb_build_object('error','no_leads'); END IF;

  UPDATE public.subscriptions SET leads_used = leads_used + got WHERE id = s.id;
  INSERT INTO public.lead_attempts (user_id, week_identifier, attempt_count)
  VALUES (uid, wk, 1)
  ON CONFLICT (user_id, week_identifier) DO UPDATE SET attempt_count = public.lead_attempts.attempt_count + 1;
  INSERT INTO public.notifications (user_id,title,body,kind)
  VALUES (uid, 'Leads allocated', got || ' new lead(s) added to your account.', 'success');
  INSERT INTO public.audit_logs (user_id, action, entity, meta)
  VALUES (uid, 'lead.claim', 'lead_allocations', jsonb_build_object('count', got, 'week', wk));

  RETURN jsonb_build_object('allocated', got, 'lead_codes', codes,
                            'remaining', p.lead_limit - (s.leads_used + got));
END; $function$;