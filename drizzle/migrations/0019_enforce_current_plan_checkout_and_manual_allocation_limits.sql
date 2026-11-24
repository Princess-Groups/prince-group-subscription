CREATE OR REPLACE FUNCTION public.plan_slot_counts()
RETURNS TABLE(plan_code text,slot_limit integer,occupied integer,remaining integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT p.code,p.slot_limit,coalesce(c.n,0)::int,CASE WHEN p.slot_limit IS NULL THEN NULL ELSE greatest(p.slot_limit-coalesce(c.n,0),0)::int END FROM public.plans p LEFT JOIN (SELECT plan_id,count(*) n FROM public.subscriptions WHERE status='pending' OR (status='active' AND start_date<=now() AND renewal_date>now()) GROUP BY plan_id) c ON c.plan_id=p.id WHERE p.active
$$;

CREATE OR REPLACE FUNCTION public.start_subscription(_plan_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); p public.plans%ROWTYPE; occupied int; sub_id uuid; pay_id uuid; q jsonb; is_first boolean; is_bank boolean;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
IF NOT public.is_phone_verified(uid) THEN RETURN jsonb_build_object('error','phone_not_verified'); END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
SELECT * INTO p FROM public.plans WHERE code=_plan_code AND active;
IF NOT FOUND THEN RETURN jsonb_build_object('error','plan_not_found'); END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('subscription-slot:'||p.id::text,0));
is_bank:=public.has_role(uid,'bank_executive') OR public.has_role(uid,'premium_bank_executive');
IF is_bank AND NOT p.bank_executive_eligible THEN RETURN jsonb_build_object('error','plan_not_available_for_bank_executive'); END IF;
IF EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=uid AND (status='pending' OR (status='active' AND start_date<=now() AND renewal_date>now()))) THEN RETURN jsonb_build_object('error','subscription_already_exists'); END IF;
IF p.slot_limit IS NOT NULL THEN
SELECT count(*) INTO occupied FROM public.subscriptions s WHERE s.plan_id=p.id AND (s.status='pending' OR (s.status='active' AND s.start_date<=now() AND s.renewal_date>now()));
IF occupied>=p.slot_limit THEN RETURN jsonb_build_object('error','slots_full'); END IF;
END IF;
is_first:=NOT EXISTS(SELECT 1 FROM public.payments WHERE user_id=uid AND status='success');
q:=public.quote_for_plan(p.code,is_first);
INSERT INTO public.subscriptions(user_id,plan_id,status) VALUES(uid,p.id,'pending') RETURNING id INTO sub_id;
INSERT INTO public.payments(user_id,subscription_id,base_amount,discount,gst,application_fee,total_amount,status,pending_plan_code) VALUES(uid,sub_id,(q->>'base_amount')::numeric,(q->>'discount')::numeric,(q->>'gst')::numeric,(q->>'application_fee')::numeric,(q->>'total_amount')::numeric,'created',p.code) RETURNING id INTO pay_id;
INSERT INTO public.notifications(user_id,title,body,kind) VALUES(uid,'Subscription created','Your '||p.name||' subscription is pending payment verification.','info');
INSERT INTO public.audit_logs(user_id,action,entity,entity_id,meta) VALUES(uid,'subscription.start','subscriptions',sub_id::text,q);
RETURN jsonb_build_object('subscription_id',sub_id,'payment_id',pay_id,'status','pending','quote',q);
END $$;

CREATE OR REPLACE FUNCTION public.admin_assign_lead(_lead_id uuid,_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.subscriptions%ROWTYPE; c public.lead_credit_periods%ROWTYPE; phone_identity text;
BEGIN
IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text,0));
SELECT * INTO s FROM public.subscriptions WHERE user_id=_user_id AND status='active' AND start_date<=now() AND renewal_date>now() ORDER BY start_date DESC LIMIT 1 FOR UPDATE;
IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
SELECT * INTO c FROM public.lead_credit_periods WHERE subscription_id=s.id AND period_start=s.start_date AND period_end>now() FOR UPDATE;
IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
IF c.used>=c.quota THEN RETURN jsonb_build_object('error','lead_limit_reached'); END IF;
SELECT public.lead_phone_key(phone) INTO phone_identity FROM public.leads WHERE id=_lead_id AND status IN ('new','assigned','contacted');
IF NOT FOUND OR phone_identity IS NULL THEN RETURN jsonb_build_object('error','lead_not_available'); END IF;
IF EXISTS(SELECT 1 FROM public.executive_lead_history WHERE user_id=_user_id AND phone_key=phone_identity) OR EXISTS(SELECT 1 FROM public.lead_allocations WHERE lead_id=_lead_id AND user_id=_user_id) THEN RETURN jsonb_build_object('error','already_allocated_to_user'); END IF;
INSERT INTO public.lead_allocations(lead_id,user_id,plan_id) VALUES(_lead_id,_user_id,s.plan_id);
UPDATE public.lead_credit_periods SET used=used+1 WHERE id=c.id;
UPDATE public.subscriptions SET leads_used=c.used+1 WHERE id=s.id;
UPDATE public.leads SET status='assigned' WHERE id=_lead_id;
INSERT INTO public.audit_logs(user_id,action,entity,entity_id,meta) VALUES(auth.uid(),'lead.assign','leads',_lead_id::text,jsonb_build_object('executive',_user_id,'credit_period',c.id));
RETURN jsonb_build_object('ok',true,'remaining',c.quota-c.used-1);
END $$;

CREATE OR REPLACE FUNCTION public.reserve_advance_period(_period text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); s public.subscriptions%ROWTYPE;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
SELECT * INTO s FROM public.subscriptions WHERE user_id=uid AND status='active' AND start_date<=now() AND renewal_date>now() ORDER BY start_date DESC LIMIT 1;
IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
UPDATE public.subscriptions SET advance_period=_period WHERE id=s.id;
INSERT INTO public.notifications(user_id,title,body,kind) VALUES(uid,'Advance access reserved','Advance access reserved for '||_period||'. It activates after payment is verified.','info');
RETURN jsonb_build_object('advance_period',_period,'status','reserved_pending_payment');
END $$;