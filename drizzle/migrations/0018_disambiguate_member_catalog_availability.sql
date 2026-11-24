CREATE OR REPLACE FUNCTION public.my_member_catalog()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); p public.plans%ROWTYPE; v_active boolean; service_rows jsonb; categories jsonb; candidates jsonb;
BEGIN
IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
v_active:=public.has_active_subscription(uid);
SELECT pl.* INTO p FROM public.subscriptions s JOIN public.plans pl ON pl.id=s.plan_id WHERE s.user_id=uid AND s.status='active' AND s.start_date<=now() AND s.renewal_date>now() ORDER BY s.start_date DESC LIMIT 1;
IF NOT v_active AND NOT public.is_admin(uid) THEN RETURN jsonb_build_object('active',false,'services','[]'::jsonb,'loan_categories','[]'::jsonb,'candidates','[]'::jsonb); END IF;
SELECT coalesce(jsonb_agg(jsonb_build_object('id',sv.id,'name',sv.name,'category',sv.category,'description',sv.description,'original_price',sv.original_price,'member_price',round(sv.original_price*(100-coalesce(p.discount_percentage,0))/100,2)) ORDER BY sv.sort_order,sv.name),'[]'::jsonb) INTO service_rows FROM public.services sv WHERE sv.active;
SELECT coalesce(jsonb_agg(jsonb_build_object('loan_type',loan_type,'available',available) ORDER BY loan_type),'[]'::jsonb) INTO categories FROM (SELECT coalesce(nullif(loan_type,''),'Loan enquiry') loan_type,count(*) available FROM public.leads WHERE NOT is_demo AND status IN ('new','assigned','contacted') GROUP BY 1) x;
SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.allocated_at DESC),'[]'::jsonb) INTO candidates FROM (SELECT a.id allocation_id,a.allocated_at,l.id,l.lead_code,l.name,l.location,l.loan_type,l.requirement,l.status FROM public.lead_allocations a JOIN public.leads l ON l.id=a.lead_id WHERE a.user_id=uid ORDER BY a.allocated_at DESC LIMIT 25) x;
RETURN jsonb_build_object('active',v_active OR public.is_admin(uid),'plan_code',p.code,'discount_percentage',coalesce(p.discount_percentage,0),'services',service_rows,'loan_categories',categories,'candidates',candidates);
END $$;