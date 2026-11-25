CREATE OR REPLACE FUNCTION public.start_subscription(_plan_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); p public.plans%ROWTYPE; occupied int; sub_id uuid; pay_id uuid; q jsonb; is_first boolean; is_bank boolean;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
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