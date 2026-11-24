CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=_user_id AND status='active' AND start_date<=now() AND renewal_date>now())
$$;

CREATE OR REPLACE FUNCTION public.my_dashboard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); s public.subscriptions%ROWTYPE; p public.plans%ROWTYPE; wk text:=to_char(now(),'IYYY-IW'); used_attempts int:=0; allocated int;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
SELECT * INTO s FROM public.subscriptions WHERE user_id=uid ORDER BY (status='active' AND start_date<=now() AND renewal_date>now()) DESC,created_at DESC LIMIT 1;
IF FOUND THEN SELECT * INTO p FROM public.plans WHERE id=s.plan_id; END IF;
SELECT coalesce(attempt_count,0) INTO used_attempts FROM public.lead_attempts WHERE user_id=uid AND week_identifier=wk;
SELECT count(*) INTO allocated FROM public.lead_allocations WHERE user_id=uid;
RETURN jsonb_build_object('has_subscription',s.id IS NOT NULL,'active',public.has_active_subscription(uid),'subscription',CASE WHEN s.id IS NULL THEN NULL ELSE jsonb_build_object('id',s.id,'status',s.status,'start_date',s.start_date,'renewal_date',s.renewal_date,'leads_used',s.leads_used,'advance_period',s.advance_period) END,'plan',CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('code',p.code,'name',p.name,'price',p.price,'daily_display',p.daily_display,'discount_percentage',p.discount_percentage,'lead_limit',p.lead_limit,'weekly_attempt_limit',p.weekly_attempt_limit,'leads_per_attempt',p.leads_per_attempt) END,'week_identifier',wk,'attempts_used',coalesce(used_attempts,0),'total_allocated',allocated,'roles',coalesce((SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id=uid),'[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.my_member_catalog()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); p public.plans%ROWTYPE; active boolean; services jsonb; categories jsonb; candidates jsonb;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
active:=public.has_active_subscription(uid);
SELECT pl.* INTO p FROM public.subscriptions s JOIN public.plans pl ON pl.id=s.plan_id WHERE s.user_id=uid AND s.status='active' AND s.start_date<=now() AND s.renewal_date>now() ORDER BY s.start_date DESC LIMIT 1;
IF NOT active AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('active',false,'services','[]'::jsonb,'loan_categories','[]'::jsonb,'candidates','[]'::jsonb); END IF;
SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'category',category,'description',description,'original_price',original_price,'member_price',round(original_price*(100-coalesce(p.discount_percentage,0))/100,2)) ORDER BY sort_order,name),'[]'::jsonb) INTO services FROM public.services WHERE active IS TRUE AND public.services.active;
SELECT coalesce(jsonb_agg(jsonb_build_object('loan_type',loan_type,'available',available) ORDER BY loan_type),'[]'::jsonb) INTO categories FROM (SELECT coalesce(nullif(loan_type,''),'Loan enquiry') loan_type,count(*) available FROM public.leads WHERE NOT is_demo AND status IN ('new','assigned','contacted') GROUP BY 1) x;
SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.allocated_at DESC),'[]'::jsonb) INTO candidates FROM (SELECT a.id allocation_id,a.allocated_at,l.id,l.lead_code,l.name,l.location,l.loan_type,l.requirement,l.status FROM public.lead_allocations a JOIN public.leads l ON l.id=a.lead_id WHERE a.user_id=uid ORDER BY a.allocated_at DESC LIMIT 25) x;
RETURN jsonb_build_object('active',active OR public.is_admin(uid),'plan_code',p.code,'discount_percentage',coalesce(p.discount_percentage,0),'services',services,'loan_categories',categories,'candidates',candidates);
END $$;
REVOKE ALL ON FUNCTION public.my_member_catalog() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_member_catalog() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.reveal_business_contact(_business_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); b public.business_contacts%ROWTYPE; plan_code text;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
IF NOT public.is_phone_verified(uid) AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('error','phone_not_verified'); END IF;
SELECT p.code INTO plan_code FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE s.user_id=uid AND s.status='active' AND s.start_date<=now() AND s.renewal_date>now() ORDER BY s.start_date DESC LIMIT 1;
IF plan_code IS NULL AND NOT public.is_admin(uid) THEN
INSERT INTO public.contact_access_logs(user_id,business_contact_id,action,status) VALUES(uid,_business_id,'view_business_contact','denied');
RETURN jsonb_build_object('error','no_active_subscription'); END IF;
SELECT * INTO b FROM public.business_contacts WHERE id=_business_id AND (status='available' OR public.is_admin(uid));
IF NOT FOUND THEN RETURN jsonb_build_object('error','contact_not_published'); END IF;
IF b.is_premium AND plan_code IS DISTINCT FROM 'premium' AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('error','premium_required'); END IF;
IF b.phone IS NULL OR b.phone='' THEN RETURN jsonb_build_object('error','contact_not_published'); END IF;
INSERT INTO public.contact_access_logs(user_id,business_contact_id,action,plan_code,status) VALUES(uid,_business_id,'view_business_contact',plan_code,'allowed');
RETURN jsonb_build_object('phone',b.phone); END $$;

CREATE OR REPLACE FUNCTION public.reveal_opportunity_contact(_opportunity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); o public.opportunities%ROWTYPE; code text;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
SELECT * INTO o FROM public.opportunities WHERE id=_opportunity_id AND (status='available' OR public.is_admin(uid));
IF NOT FOUND THEN RETURN jsonb_build_object('error','contact_not_published'); END IF;
SELECT p.code INTO code FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE s.user_id=uid AND s.status='active' AND s.start_date<=now() AND s.renewal_date>now() ORDER BY s.start_date DESC LIMIT 1;
IF code IS NULL AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
IF o.premium_only AND code IS DISTINCT FROM 'premium' AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('error','premium_required'); END IF;
IF o.lead_id IS NOT NULL THEN RETURN public.reveal_lead_contact(o.lead_id); END IF;
IF o.business_id IS NOT NULL THEN RETURN public.reveal_business_contact(o.business_id); END IF;
RETURN jsonb_build_object('error','contact_not_published'); END $$;
REVOKE ALL ON FUNCTION public.reveal_opportunity_contact(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reveal_opportunity_contact(uuid) TO authenticated,service_role;