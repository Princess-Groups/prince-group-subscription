-- Temporarily disable GST AND the application fee so the charged amount equals
-- the plan price shown on the website. Re-enable later by restoring these.
UPDATE public.settings SET value = '0' WHERE key IN ('gst_percentage', 'application_fee');

CREATE OR REPLACE FUNCTION public.quote_for_plan(_plan_code text, _first_payment boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.plans%ROWTYPE;
  gst_pct numeric := 0;
  fee numeric := 0;
  dec jsonb; base numeric; disc numeric := 0; disc_label text := NULL;
  taxable numeric; gst_amt numeric; total numeric;
BEGIN
  SELECT * INTO p FROM public.plans WHERE code = _plan_code AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','plan_not_found'); END IF;

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