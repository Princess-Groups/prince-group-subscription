-- helper: read numeric setting
CREATE OR REPLACE FUNCTION public.setting_num(_key text, _default numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT (value #>> '{}')::numeric FROM public.settings WHERE key = _key), _default)
$$;

-- slot availability (public)
CREATE OR REPLACE FUNCTION public.plan_slot_counts()
RETURNS TABLE (plan_code text, slot_limit int, occupied int, remaining int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.code,
         p.slot_limit,
         COALESCE(c.n, 0)::int,
         CASE WHEN p.slot_limit IS NULL THEN NULL ELSE GREATEST(p.slot_limit - COALESCE(c.n,0), 0)::int END
  FROM public.plans p
  LEFT JOIN (
    SELECT plan_id, count(*) n FROM public.subscriptions WHERE status IN ('active','pending') GROUP BY plan_id
  ) c ON c.plan_id = p.id
  WHERE p.active
$$;
GRANT EXECUTE ON FUNCTION public.plan_slot_counts() TO anon, authenticated;

-- quote calculation (public, server-side truth)
CREATE OR REPLACE FUNCTION public.quote_for_plan(_plan_code text, _first_payment boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.plans%ROWTYPE;
  gst_pct numeric; fee numeric; fee_on boolean; fee_first boolean;
  dec jsonb; base numeric; disc numeric := 0; disc_label text := NULL;
  taxable numeric; gst_amt numeric; total numeric;
BEGIN
  SELECT * INTO p FROM public.plans WHERE code = _plan_code AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','plan_not_found'); END IF;

  gst_pct := public.setting_num('gst_percentage', 18);
  fee := public.setting_num('application_fee', 99);
  fee_on := COALESCE((SELECT (value #>> '{}')::boolean FROM public.settings WHERE key='application_fee_enabled'), true);
  fee_first := COALESCE((SELECT (value #>> '{}')::boolean FROM public.settings WHERE key='application_fee_first_payment_only'), true);
  IF NOT fee_on OR (fee_first AND NOT _first_payment) THEN fee := 0; END IF;

  base := p.price;

  dec := (SELECT value FROM public.settings WHERE key='december_offer');
  IF dec IS NOT NULL AND COALESCE((dec->>'enabled')::boolean,false)
     AND CURRENT_DATE BETWEEN COALESCE((dec->>'start_date')::date, CURRENT_DATE)
                          AND COALESCE((dec->>'end_date')::date, CURRENT_DATE)
     AND (dec->'plans' IS NULL OR dec->'plans' @> to_jsonb(p.code)) THEN
    disc := round(base * COALESCE((dec->>'discount')::numeric,0) / 100, 2);
    disc_label := 'December Exclusive';
  END IF;

  taxable := base - disc + fee;
  gst_amt := round(taxable * gst_pct / 100, 2);
  total := round(taxable + gst_amt, 2);

  RETURN jsonb_build_object(
    'plan_code', p.code, 'plan_name', p.name,
    'base_amount', base, 'discount', disc, 'discount_label', disc_label,
    'application_fee', fee, 'gst_percentage', gst_pct, 'gst', gst_amt,
    'total_amount', total, 'billing_period', p.billing_period);
END; $$;
GRANT EXECUTE ON FUNCTION public.quote_for_plan(text, boolean) TO anon, authenticated;

-- start a subscription (never marks payment as successful)
CREATE OR REPLACE FUNCTION public.start_subscription(_plan_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  p public.plans%ROWTYPE;
  occupied int; sub_id uuid; q jsonb; is_first boolean;
  is_bank boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
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
END; $$;
GRANT EXECUTE ON FUNCTION public.start_subscription(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_subscription()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  UPDATE public.subscriptions SET status='cancelled', cancellation_date = now()
  WHERE user_id = uid AND status IN ('active','pending','payment_failed');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    INSERT INTO public.notifications (user_id,title,body,kind) VALUES (uid,'Subscription cancelled','Your subscription has been cancelled.','warning');
    INSERT INTO public.audit_logs (user_id, action, entity) VALUES (uid,'subscription.cancel','subscriptions');
  END IF;
  RETURN jsonb_build_object('cancelled', n);
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_my_subscription() TO authenticated;

-- dashboard snapshot
CREATE OR REPLACE FUNCTION public.my_dashboard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid(); s public.subscriptions%ROWTYPE; p public.plans%ROWTYPE;
  wk text := to_char(now(),'IYYY-IW'); used_attempts int := 0; allocated int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN SELECT * INTO p FROM public.plans WHERE id = s.plan_id; END IF;
  SELECT COALESCE(attempt_count,0) INTO used_attempts FROM public.lead_attempts WHERE user_id = uid AND week_identifier = wk;
  SELECT count(*) INTO allocated FROM public.lead_allocations WHERE user_id = uid;

  RETURN jsonb_build_object(
    'has_subscription', s.id IS NOT NULL,
    'subscription', CASE WHEN s.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', s.id, 'status', s.status, 'start_date', s.start_date, 'renewal_date', s.renewal_date,
        'leads_used', s.leads_used, 'advance_period', s.advance_period) END,
    'plan', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
        'code', p.code, 'name', p.name, 'price', p.price, 'daily_display', p.daily_display,
        'discount_percentage', p.discount_percentage, 'lead_limit', p.lead_limit,
        'weekly_attempt_limit', p.weekly_attempt_limit, 'leads_per_attempt', p.leads_per_attempt) END,
    'week_identifier', wk,
    'attempts_used', COALESCE(used_attempts,0),
    'total_allocated', allocated,
    'roles', COALESCE((SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id = uid), '[]'::jsonb)
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.my_dashboard() TO authenticated;

-- lead allocation engine
CREATE OR REPLACE FUNCTION public.claim_leads()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid(); s public.subscriptions%ROWTYPE; p public.plans%ROWTYPE;
  wk text := to_char(now(),'IYYY-IW'); used_attempts int := 0; remaining int; n int; got int;
  codes jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
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
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_leads() TO authenticated;

-- contact reveal with access control + logging
CREATE OR REPLACE FUNCTION public.reveal_lead_contact(_lead_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); ph text; code text; plan_code text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
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
END; $$;
GRANT EXECUTE ON FUNCTION public.reveal_lead_contact(uuid) TO authenticated;

-- advance access reservation
CREATE OR REPLACE FUNCTION public.reserve_advance_period(_period text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); s public.subscriptions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid AND status='active' ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  UPDATE public.subscriptions SET advance_period = _period WHERE id = s.id;
  INSERT INTO public.notifications (user_id,title,body,kind)
  VALUES (uid,'Advance access reserved','Advance access reserved for ' || _period || '. It activates after payment is verified.','info');
  RETURN jsonb_build_object('advance_period', _period, 'status','reserved_pending_payment');
END; $$;
GRANT EXECUTE ON FUNCTION public.reserve_advance_period(text) TO authenticated;

-- admin analytics
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'active_subscribers', (SELECT count(*) FROM public.subscriptions WHERE status='active'),
    'starter_subs', (SELECT count(*) FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE p.code='starter' AND s.status='active'),
    'business_subs', (SELECT count(*) FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE p.code='business' AND s.status='active'),
    'premium_subs', (SELECT count(*) FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE p.code='premium' AND s.status='active'),
    'bank_executives', (SELECT count(*) FROM public.user_roles WHERE role IN ('bank_executive','premium_bank_executive')),
    'total_leads', (SELECT count(*) FROM public.leads),
    'assigned_leads', (SELECT count(DISTINCT lead_id) FROM public.lead_allocations),
    'unassigned_leads', (SELECT count(*) FROM public.leads l WHERE NOT EXISTS (SELECT 1 FROM public.lead_allocations la WHERE la.lead_id=l.id)),
    'revenue', (SELECT COALESCE(sum(total_amount),0) FROM public.payments WHERE status='success'),
    'failed_payments', (SELECT count(*) FROM public.payments WHERE status='failed'),
    'cancelled_subs', (SELECT count(*) FROM public.subscriptions WHERE status='cancelled'),
    'pending_payments', (SELECT count(*) FROM public.payments WHERE status IN ('created','pending'))
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(_sub_id uuid, _status public.sub_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  UPDATE public.subscriptions SET status = _status,
    start_date = CASE WHEN _status='active' AND start_date IS NULL THEN now() ELSE start_date END,
    renewal_date = CASE WHEN _status='active' THEN COALESCE(start_date, now()) + interval '30 days' ELSE renewal_date END
  WHERE id = _sub_id RETURNING user_id INTO u;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, meta)
  VALUES (auth.uid(),'subscription.status','subscriptions',_sub_id::text, jsonb_build_object('status',_status));
  INSERT INTO public.notifications (user_id,title,body,kind) VALUES (u,'Subscription updated','Status: ' || _status,'info');
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_status(uuid, public.sub_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_assign_lead(_lead_id uuid, _user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  IF EXISTS (SELECT 1 FROM public.lead_allocations WHERE lead_id=_lead_id AND user_id=_user_id) THEN
    RETURN jsonb_build_object('error','already_allocated_to_user');
  END IF;
  SELECT plan_id INTO pid FROM public.subscriptions WHERE user_id=_user_id AND status='active' LIMIT 1;
  INSERT INTO public.lead_allocations (lead_id,user_id,plan_id) VALUES (_lead_id,_user_id,pid);
  UPDATE public.leads SET status='assigned' WHERE id=_lead_id;
  INSERT INTO public.audit_logs (user_id,action,entity,entity_id) VALUES (auth.uid(),'lead.assign','leads',_lead_id::text);
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_assign_lead(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role public.app_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
  INSERT INTO public.audit_logs (user_id,action,entity,entity_id,meta)
  VALUES (auth.uid(),'user.role','profiles',_user_id::text, jsonb_build_object('role',_role));
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(_user_id uuid, _status public.account_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  UPDATE public.profiles SET status = _status WHERE id = _user_id;
  INSERT INTO public.audit_logs (user_id,action,entity,entity_id,meta)
  VALUES (auth.uid(),'user.status','profiles',_user_id::text, jsonb_build_object('status',_status));
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, public.account_status) TO authenticated;

-- bootstrap: first ever account can claim super admin
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('admin','super_admin')) THEN
    RETURN jsonb_build_object('error','admin_exists');
  END IF;
  DELETE FROM public.user_roles WHERE user_id = uid;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin');
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;