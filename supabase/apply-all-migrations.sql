-- Bootstrap script for a fresh Supabase project.
-- Run once in the Supabase SQL Editor (or with psql using a direct DB connection).
-- It applies every migration in drizzle/migrations/ in filename order.

-- ============ 0000_create_subscription_lead_platform.sql ============
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','customer','bank_executive','premium_bank_executive');
CREATE TYPE public.sub_status AS ENUM ('pending','active','payment_failed','paused','cancelled','expired');
CREATE TYPE public.pay_status AS ENUM ('created','pending','success','failed','refunded');
CREATE TYPE public.lead_status AS ENUM ('new','assigned','contacted','converted','closed');
CREATE TYPE public.account_status AS ENUM ('pending','active','suspended','rejected');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  status public.account_status NOT NULL DEFAULT 'active',
  employee_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'))
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name',''), COALESCE(NEW.email,''), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  daily_display numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL,
  billing_period text NOT NULL DEFAULT 'monthly',
  discount_percentage int NOT NULL DEFAULT 0,
  lead_limit int NOT NULL DEFAULT 0,
  weekly_attempt_limit int NOT NULL DEFAULT 1,
  leads_per_attempt int NOT NULL DEFAULT 10,
  slot_limit int,
  bank_executive_eligible boolean NOT NULL DEFAULT true,
  highlight boolean NOT NULL DEFAULT false,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.plans FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "plans admin write" ON public.plans FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  razorpay_subscription_id text,
  status public.sub_status NOT NULL DEFAULT 'pending',
  start_date timestamptz,
  renewal_date timestamptz,
  cancellation_date timestamptz,
  leads_used int NOT NULL DEFAULT 0,
  advance_period text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  base_amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  application_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  razorpay_order_id text,
  razorpay_payment_id text,
  status public.pay_status NOT NULL DEFAULT 'created',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read own" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- LEADS
CREATE SEQUENCE public.lead_seq START 1;
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_code text NOT NULL UNIQUE DEFAULT 'LEAD-' || lpad(nextval('public.lead_seq')::text, 6, '0'),
  name text NOT NULL,
  phone text NOT NULL,
  location text,
  loan_type text,
  requirement text,
  estimated_amount numeric,
  eligibility text,
  status public.lead_status NOT NULL DEFAULT 'new',
  source text DEFAULT 'demo',
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads admin all" ON public.leads FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- LEAD ALLOCATIONS
CREATE TABLE public.lead_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  allocated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'allocated',
  UNIQUE (lead_id, user_id)
);
GRANT SELECT ON public.lead_allocations TO authenticated;
GRANT ALL ON public.lead_allocations TO service_role;
ALTER TABLE public.lead_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alloc read own" ON public.lead_allocations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "leads allocated read" ON public.leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lead_allocations la WHERE la.lead_id = leads.id AND la.user_id = auth.uid()));

-- LEAD ATTEMPTS
CREATE TABLE public.lead_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_identifier text NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_identifier)
);
GRANT SELECT ON public.lead_attempts TO authenticated;
GRANT ALL ON public.lead_attempts TO service_role;
ALTER TABLE public.lead_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts read own" ON public.lead_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- CONTACT ACCESS LOGS
CREATE TABLE public.contact_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  business_contact_id uuid,
  action text NOT NULL DEFAULT 'view_contact',
  plan_code text,
  status text NOT NULL DEFAULT 'allowed',
  accessed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_access_logs TO authenticated;
GRANT ALL ON public.contact_access_logs TO service_role;
ALTER TABLE public.contact_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal read own" ON public.contact_access_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- BUSINESS CONTACTS
CREATE TABLE public.business_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text,
  business_type text,
  location text,
  district text,
  phone text,
  status text NOT NULL DEFAULT 'available',
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_contacts TO authenticated;
GRANT ALL ON public.business_contacts TO service_role;
ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc read auth" ON public.business_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "bc admin write" ON public.business_contacts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  original_price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "services admin write" ON public.services FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- OFFERS
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  applicable_plan text,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers public read" ON public.offers FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "offers admin write" ON public.offers FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  public_read boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (public_read);
CREATE POLICY "settings admin all" ON public.settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- SEED PLANS
INSERT INTO public.plans (code,name,tagline,daily_display,price,billing_period,discount_percentage,lead_limit,weekly_attempt_limit,leads_per_attempt,slot_limit,bank_executive_eligible,highlight,benefits,sort_order) VALUES
('starter','Starter','Begin your premium access',1,30,'monthly',25,10,1,10,NULL,false,false,
 '["Flat 25% discount across eligible services","Access to selected subscription benefits","Up to 10 lead allocations per month","Member dashboard","Subscription management","Access to eligible opportunities","Member-only offers"]'::jsonb,1),
('business','Business','Scale with data & leads',10,300,'monthly',50,500,1,25,500,true,false,
 '["Flat 50% discount on eligible services","500 available lead/data slots","Access to eligible loan profiles","Access to business contacts","Access to selected B2B opportunities","Direct contact/action options where permitted","Member dashboard","Advance-month access option"]'::jsonb,2),
('premium','Premium','Maximum access & priority',100,3000,'monthly',75,2000,2,50,100,true,true,
 '["Flat 75% discount on eligible services","Premium loan profiles","Premium business opportunities","Higher-priority lead access","Direct lead access where permitted","Premium member dashboard","Advanced lead management","Premium resources"]'::jsonb,3);

-- SEED SETTINGS
INSERT INTO public.settings (key,value) VALUES
('gst_percentage','18'::jsonb),
('application_fee','99'::jsonb),
('application_fee_enabled','true'::jsonb),
('application_fee_first_payment_only','true'::jsonb),
('support_phone','"95559155535"'::jsonb),
('support_email','"support@example.com"'::jsonb),
('demo_mode','true'::jsonb),
('razorpay_mode','"test"'::jsonb),
('razorpay_key_id','""'::jsonb),
('hero_stats','[{"label":"Business Contacts","value":"6,00,000+"},{"label":"Loan Profiles","value":"1,00,000+"},{"label":"Daily Enquiries","value":"1,000+"},{"label":"Premium Slots","value":"Limited"}]'::jsonb),
('december_offer','{"enabled":true,"discount":10,"start_date":"2026-12-01","end_date":"2026-12-31","plans":["premium"]}'::jsonb),
('loan_client_offer','{"enabled":true,"first_month":99,"next_month":10,"discount_label":"33% OFF for First Month","advance_mode":true}'::jsonb),
('premium_billing_cycle','"monthly"'::jsonb);

-- SEED SERVICES
INSERT INTO public.services (category,name,description,original_price,sort_order) VALUES
('Loan Services','Personal Loan Assistance','End-to-end personal loan documentation and lender matching.',5000,1),
('Loan Services','Business Loan Assistance','Business loan profiling, eligibility check and lender submission.',9000,2),
('Loan Services','Home Loan Assistance','Home loan paperwork, valuation coordination and follow-up.',12000,3),
('Loan Services','Vehicle Loan Assistance','Vehicle finance sourcing and documentation support.',4000,4),
('Loan Services','Education Loan Assistance','Education loan guidance and application handling.',4500,5),
('Loan Services','Working Capital Support','Working capital facility structuring assistance.',15000,6),
('Loan Services','MSME Loan Assistance','MSME scheme eligibility and application support.',8000,7),
('Documentation Services','Marriage Registration','Registration filing and appointment assistance.',3500,8),
('Documentation Services','Land Survey','Licensed survey coordination and report handling.',7000,9),
('Documentation Services','Registration Assistance','General registration and paperwork assistance.',3000,10),
('Digital Marketing','Website Development','Business website design and development.',25000,11),
('Digital Marketing','SEO','Search engine optimisation retainer.',15000,12),
('Digital Marketing','Social Media Marketing','Monthly social media management.',12000,13),
('Digital Marketing','Graphic Design','Creative design pack for campaigns.',8000,14),
('Digital Marketing','Video Editing','Professional editing for brand videos.',10000,15),
('Digital Marketing','Reels Creation','Short-form reels production pack.',9000,16),
('Digital Marketing','Google Ads','Google Ads setup and management.',14000,17),
('Digital Marketing','Meta Ads','Meta Ads setup and management.',13000,18),
('Digital Marketing','WhatsApp Marketing','Bulk WhatsApp campaign management.',6000,19),
('Software Services','Billing Software','GST billing software licence and setup.',18000,20),
('Software Services','Accounting Software','Accounting suite with onboarding.',22000,21),
('Software Services','HR Software','HR and payroll management software.',20000,22),
('Software Services','Business Management Software','All-in-one business operations suite.',35000,23),
('Software Services','Custom Software','Bespoke software development.',50000,24);

-- SEED OFFERS
INSERT INTO public.offers (code,title,description,discount,start_date,end_date,applicable_plan) VALUES
('december','December Exclusive â€“ Save 10% on Annual Plan','Automatically applied during the configured December campaign window.',10,'2026-12-01','2026-12-31','premium'),
('loan_client','One of the Best Subscription Plans for Loan Clients','33% OFF for first month. First month â‚¹99 + GST, next month â‚¹10 + GST.',33,NULL,NULL,'business');

-- SEED DEMO LEADS
INSERT INTO public.leads (name,phone,location,loan_type,requirement,estimated_amount,eligibility,is_demo)
SELECT
  'Demo Customer ' || g,
  '99' || lpad((10000000 + g)::text, 8, '0'),
  (ARRAY['Nagercoil','Kanyakumari','Marthandam','Thuckalay','Colachel','Chennai','Madurai'])[1 + (g % 7)],
  (ARRAY['Personal Loan','Business Loan','Home Loan','Vehicle Loan','Education Loan','MSME Loan','Working Capital','Mortgage Loan','Loan Against Property'])[1 + (g % 9)],
  'Sample requirement record for demonstration only.',
  (100000 + (g * 25000) % 4000000),
  (ARRAY['Eligible','Under Review','Documents Pending'])[1 + (g % 3)],
  true
FROM generate_series(1,120) g;

-- SEED DEMO BUSINESS CONTACTS
INSERT INTO public.business_contacts (business_name,category,business_type,location,district,phone,is_demo)
SELECT
  'Demo Enterprise ' || g,
  (ARRAY['Retail','Manufacturing','Textiles','Hardware','Food & Beverage','Automobile','Healthcare','Education'])[1 + (g % 8)],
  (ARRAY['Proprietorship','Partnership','Private Limited','LLP'])[1 + (g % 4)],
  (ARRAY['Nagercoil','Kanyakumari','Marthandam','Thuckalay','Colachel'])[1 + (g % 5)],
  'Kanyakumari',
  '98' || lpad((20000000 + g)::text, 8, '0'),
  true
FROM generate_series(1,150) g;


-- ============ 0001_platform_engine_functions.sql ============
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


-- ============ 0002_directory_opportunities_upgrade.sql ============
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


-- ============ 0003_public_directory_read_without_phone.sql ============
-- Public directory read: everything except the phone number.
REVOKE SELECT ON public.business_contacts FROM anon, authenticated;

GRANT SELECT (
  id, business_name, category, business_type, location, district, status, is_demo,
  description, services, website, social_links, contact_locked, is_premium, is_popular, created_at
) ON public.business_contacts TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.business_contacts TO authenticated;
GRANT ALL ON public.business_contacts TO service_role;

DROP POLICY IF EXISTS "bc read auth" ON public.business_contacts;
CREATE POLICY "bc public read" ON public.business_contacts
  FOR SELECT TO anon, authenticated USING (true);


-- ============ 0004_payment_submissions.sql ============
CREATE TABLE public.payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  plan_code text,
  item text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  utr text NOT NULL,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending_verification',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

GRANT SELECT, INSERT ON public.payment_submissions TO authenticated;
GRANT ALL ON public.payment_submissions TO service_role;

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment submissions insert own" ON public.payment_submissions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment submissions read own or admin" ON public.payment_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "payment submissions admin update" ON public.payment_submissions
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "payment proofs upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment proofs read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));


-- ============ 0005_enquiry_connect_network.sql ============
-- ============ Prince Group ENQUIRY / CONNECT network ============

-- Helper: active paid subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND status = 'active')
$$;

-- ---------- categories ----------
CREATE TABLE public.member_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'briefcase',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.member_categories TO anon, authenticated;
GRANT ALL ON public.member_categories TO service_role;
ALTER TABLE public.member_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat public read" ON public.member_categories FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "cat admin write" ON public.member_categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.member_categories (name, icon, sort_order) VALUES
  ('Banking & Finance','landmark',1),
  ('Business Owner','store',2),
  ('Entrepreneur','rocket',3),
  ('Recruitment & HR','users',4),
  ('Digital Marketing','megaphone',5),
  ('Service Provider','wrench',6),
  ('Dealer / Distributor','truck',7),
  ('Consultant','briefcase',8),
  ('Real Estate','building-2',9),
  ('Manufacturing','factory',10),
  ('Retail & Wholesale','shopping-bag',11),
  ('Education & Training','graduation-cap',12);

-- ---------- member profiles ----------
CREATE TYPE public.member_status AS ENUM ('pending','approved','suspended');

CREATE TABLE public.member_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  photo_url text,
  company_name text NOT NULL DEFAULT '',
  company_logo_url text,
  designation text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Kanyakumari',
  about_me text NOT NULL DEFAULT '',
  about_company text NOT NULL DEFAULT '',
  products_services text NOT NULL DEFAULT '',
  what_we_offer text NOT NULL DEFAULT '',
  what_we_need text NOT NULL DEFAULT '',
  website text,
  business_email text,
  business_phone text,
  show_phone boolean NOT NULL DEFAULT false,
  show_email boolean NOT NULL DEFAULT false,
  preferred_contact text NOT NULL DEFAULT 'message',
  status public.member_status NOT NULL DEFAULT 'approved',
  featured boolean NOT NULL DEFAULT false,
  communication_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search_doc tsvector GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(full_name,'') || ' ' || coalesce(company_name,'') || ' ' || coalesce(designation,'') || ' ' ||
      coalesce(category,'') || ' ' || coalesce(location,'') || ' ' || coalesce(about_company,'') || ' ' ||
      coalesce(products_services,'') || ' ' || coalesce(what_we_offer,'') || ' ' || coalesce(what_we_need,''))
  ) STORED
);
GRANT SELECT, INSERT, UPDATE ON public.member_profiles TO authenticated;
GRANT ALL ON public.member_profiles TO service_role;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp own all" ON public.member_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid())
         OR (status = 'approved' AND public.has_active_subscription(auth.uid())));
CREATE POLICY "mp insert own" ON public.member_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "mp update own" ON public.member_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX member_profiles_search_idx ON public.member_profiles USING gin (search_doc);
CREATE INDEX member_profiles_category_idx ON public.member_profiles (category);
CREATE INDEX member_profiles_location_idx ON public.member_profiles (location);
CREATE INDEX member_profiles_created_idx ON public.member_profiles (created_at DESC);

-- ---------- enquiries ----------
CREATE TYPE public.enquiry_status AS ENUM ('active','connected','closed');

CREATE TABLE public.member_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  enquiry_type text NOT NULL DEFAULT 'I Need',
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  what_i_need text NOT NULL DEFAULT '',
  what_i_offer text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Kanyakumari',
  contact_preference text NOT NULL DEFAULT 'message',
  status public.enquiry_status NOT NULL DEFAULT 'active',
  featured boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  search_doc tsvector GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(enquiry_type,'') || ' ' || coalesce(category,'') || ' ' ||
      coalesce(description,'') || ' ' || coalesce(what_i_need,'') || ' ' || coalesce(what_i_offer,'') || ' ' ||
      coalesce(location,''))
  ) STORED
);
GRANT SELECT, INSERT, UPDATE ON public.member_enquiries TO authenticated;
GRANT ALL ON public.member_enquiries TO service_role;
ALTER TABLE public.member_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enq read" ON public.member_enquiries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid())
         OR (NOT hidden AND public.has_active_subscription(auth.uid())));
CREATE POLICY "enq insert own" ON public.member_enquiries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));
CREATE POLICY "enq update own" ON public.member_enquiries FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX member_enquiries_search_idx ON public.member_enquiries USING gin (search_doc);
CREATE INDEX member_enquiries_created_idx ON public.member_enquiries (created_at DESC);
CREATE INDEX member_enquiries_user_idx ON public.member_enquiries (user_id);

-- ---------- conversations ----------
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX cp_user_idx ON public.conversation_participants (user_id);

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
                 WHERE conversation_id = _conversation_id AND user_id = _user_id)
$$;

GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv read member" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "cp read member" ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "cp update own" ON public.conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "msg read member" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "msg insert member" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
              AND public.is_conversation_member(conversation_id, auth.uid())
              AND public.has_active_subscription(auth.uid())
              AND NOT EXISTS (SELECT 1 FROM public.member_profiles mp
                              WHERE mp.user_id = auth.uid() AND mp.communication_blocked));

-- ---------- connection requests ----------
CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enquiry_id uuid REFERENCES public.member_enquiries(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user)
);
GRANT SELECT, INSERT, UPDATE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr read own" ON public.connection_requests FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "cr insert own" ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid() AND public.has_active_subscription(auth.uid()));
CREATE POLICY "cr update target" ON public.connection_requests FOR UPDATE TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid()) WITH CHECK (to_user = auth.uid() OR from_user = auth.uid());

-- ---------- calls ----------
CREATE TABLE public.member_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'calling',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.member_calls TO authenticated;
GRANT ALL ON public.member_calls TO service_role;
ALTER TABLE public.member_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calls read own" ON public.member_calls FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "calls insert own" ON public.member_calls FOR INSERT TO authenticated
  WITH CHECK (caller_id = auth.uid() AND public.has_active_subscription(auth.uid()));
CREATE POLICY "calls update own" ON public.member_calls FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid()) WITH CHECK (caller_id = auth.uid() OR callee_id = auth.uid());

-- ---------- reports & blocks ----------
CREATE TABLE public.member_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.member_reports TO authenticated;
GRANT UPDATE ON public.member_reports TO authenticated;
GRANT ALL ON public.member_reports TO service_role;
ALTER TABLE public.member_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rep read own" ON public.member_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "rep insert own" ON public.member_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "rep admin update" ON public.member_reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.member_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.member_blocks TO authenticated;
GRANT ALL ON public.member_blocks TO service_role;
ALTER TABLE public.member_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blk read own" ON public.member_blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "blk insert own" ON public.member_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blk delete own" ON public.member_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- ---------- server-side search (paginated) ----------
CREATE OR REPLACE FUNCTION public.search_members(
  _q text DEFAULT NULL, _category text DEFAULT NULL, _location text DEFAULT NULL,
  _limit int DEFAULT 12, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); sub boolean; rows jsonb; total int; lim int;
BEGIN
  sub := uid IS NOT NULL AND (public.has_active_subscription(uid) OR public.is_admin(uid));
  lim := LEAST(COALESCE(_limit,12), 48);
  IF NOT sub THEN lim := 6; _offset := 0; END IF;

  WITH base AS (
    SELECT mp.* FROM public.member_profiles mp
    WHERE mp.status = 'approved'
      AND (uid IS NULL OR mp.user_id <> uid)
      AND (_q IS NULL OR _q = '' OR mp.search_doc @@ plainto_tsquery('simple', _q)
           OR mp.full_name ILIKE '%'||_q||'%' OR mp.company_name ILIKE '%'||_q||'%')
      AND (_category IS NULL OR _category = '' OR mp.category = _category)
      AND (_location IS NULL OR _location = '' OR mp.location ILIKE '%'||_location||'%')
      AND NOT EXISTS (SELECT 1 FROM public.member_blocks b
                      WHERE (b.blocker_id = uid AND b.blocked_id = mp.user_id)
                         OR (b.blocked_id = uid AND b.blocker_id = mp.user_id))
  )
  SELECT count(*)::int INTO total FROM base;

  WITH base AS (
    SELECT mp.* FROM public.member_profiles mp
    WHERE mp.status = 'approved'
      AND (uid IS NULL OR mp.user_id <> uid)
      AND (_q IS NULL OR _q = '' OR mp.search_doc @@ plainto_tsquery('simple', _q)
           OR mp.full_name ILIKE '%'||_q||'%' OR mp.company_name ILIKE '%'||_q||'%')
      AND (_category IS NULL OR _category = '' OR mp.category = _category)
      AND (_location IS NULL OR _location = '' OR mp.location ILIKE '%'||_location||'%')
      AND NOT EXISTS (SELECT 1 FROM public.member_blocks b
                      WHERE (b.blocker_id = uid AND b.blocked_id = mp.user_id)
                         OR (b.blocked_id = uid AND b.blocker_id = mp.user_id))
    ORDER BY mp.featured DESC, mp.created_at DESC
    LIMIT lim OFFSET GREATEST(COALESCE(_offset,0),0)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', CASE WHEN sub THEN user_id::text ELSE NULL END,
    'full_name', CASE WHEN sub THEN full_name ELSE split_part(full_name,' ',1) || ' â€¢â€¢â€¢â€¢' END,
    'photo_url', photo_url, 'company_logo_url', company_logo_url,
    'company_name', company_name, 'designation', designation, 'category', category,
    'location', location, 'about_company', left(about_company, 220),
    'products_services', products_services, 'what_we_offer', what_we_offer,
    'what_we_need', what_we_need, 'featured', featured, 'locked', NOT sub
  ) ORDER BY featured DESC, created_at DESC), '[]'::jsonb) INTO rows FROM base;

  RETURN jsonb_build_object('rows', rows, 'total', total, 'subscribed', sub, 'limit', lim);
END; $$;

CREATE OR REPLACE FUNCTION public.get_member_profile(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); sub boolean; m public.member_profiles%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  sub := public.has_active_subscription(uid) OR public.is_admin(uid);
  IF NOT sub THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  SELECT * INTO m FROM public.member_profiles WHERE user_id = _user_id AND status = 'approved';
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  RETURN jsonb_build_object(
    'user_id', m.user_id, 'full_name', m.full_name, 'photo_url', m.photo_url,
    'company_name', m.company_name, 'company_logo_url', m.company_logo_url,
    'designation', m.designation, 'category', m.category, 'location', m.location,
    'about_me', m.about_me, 'about_company', m.about_company,
    'products_services', m.products_services, 'what_we_offer', m.what_we_offer,
    'what_we_need', m.what_we_need, 'website', m.website,
    'business_email', CASE WHEN m.show_email THEN m.business_email ELSE NULL END,
    'business_phone', CASE WHEN m.show_phone THEN m.business_phone ELSE NULL END,
    'preferred_contact', m.preferred_contact, 'featured', m.featured,
    'created_at', m.created_at);
END; $$;

CREATE OR REPLACE FUNCTION public.search_enquiries(
  _q text DEFAULT NULL, _category text DEFAULT NULL, _type text DEFAULT NULL,
  _limit int DEFAULT 12, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); sub boolean; rows jsonb; total int; lim int;
BEGIN
  sub := uid IS NOT NULL AND (public.has_active_subscription(uid) OR public.is_admin(uid));
  lim := LEAST(COALESCE(_limit,12), 48);
  IF NOT sub THEN lim := 6; _offset := 0; END IF;

  SELECT count(*)::int INTO total FROM public.member_enquiries e
  WHERE NOT e.hidden AND e.status <> 'closed'
    AND (_q IS NULL OR _q = '' OR e.search_doc @@ plainto_tsquery('simple', _q) OR e.title ILIKE '%'||_q||'%')
    AND (_category IS NULL OR _category = '' OR e.category = _category)
    AND (_type IS NULL OR _type = '' OR e.enquiry_type = _type);

  SELECT COALESCE(jsonb_agg(r ORDER BY (r->>'featured')::boolean DESC, r->>'created_at' DESC), '[]'::jsonb)
  INTO rows FROM (
    SELECT jsonb_build_object(
      'id', e.id, 'title', e.title, 'enquiry_type', e.enquiry_type, 'category', e.category,
      'description', CASE WHEN sub THEN e.description ELSE left(e.description, 90) || 'â€¦' END,
      'what_i_need', CASE WHEN sub THEN e.what_i_need ELSE NULL END,
      'what_i_offer', CASE WHEN sub THEN e.what_i_offer ELSE NULL END,
      'location', e.location, 'status', e.status, 'featured', e.featured,
      'created_at', e.created_at,
      'author_id', CASE WHEN sub THEN e.user_id::text ELSE NULL END,
      'author_name', CASE WHEN sub THEN mp.full_name ELSE 'Verified Subscriber' END,
      'author_company', CASE WHEN sub THEN mp.company_name ELSE NULL END,
      'locked', NOT sub) AS r
    FROM public.member_enquiries e
    LEFT JOIN public.member_profiles mp ON mp.user_id = e.user_id
    WHERE NOT e.hidden AND e.status <> 'closed'
      AND (_q IS NULL OR _q = '' OR e.search_doc @@ plainto_tsquery('simple', _q) OR e.title ILIKE '%'||_q||'%')
      AND (_category IS NULL OR _category = '' OR e.category = _category)
      AND (_type IS NULL OR _type = '' OR e.enquiry_type = _type)
    ORDER BY e.featured DESC, e.created_at DESC
    LIMIT lim OFFSET GREATEST(COALESCE(_offset,0),0)
  ) s;

  RETURN jsonb_build_object('rows', rows, 'total', total, 'subscribed', sub);
END; $$;

-- ---------- conversation actions ----------
CREATE OR REPLACE FUNCTION public.start_direct_conversation(_other_user uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cid uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.has_active_subscription(uid) THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  IF NOT public.has_active_subscription(_other_user) THEN RETURN jsonb_build_object('error','member_not_active'); END IF;
  IF EXISTS (SELECT 1 FROM public.member_blocks WHERE (blocker_id=_other_user AND blocked_id=uid) OR (blocker_id=uid AND blocked_id=_other_user)) THEN
    RETURN jsonb_build_object('error','blocked');
  END IF;

  SELECT c.id INTO cid FROM public.conversations c
   WHERE NOT c.is_group
     AND EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id=c.id AND p.user_id=uid)
     AND EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id=c.id AND p.user_id=_other_user)
     AND (SELECT count(*) FROM public.conversation_participants p WHERE p.conversation_id=c.id) = 2
   LIMIT 1;

  IF cid IS NULL THEN
    INSERT INTO public.conversations (created_by) VALUES (uid) RETURNING id INTO cid;
    INSERT INTO public.conversation_participants (conversation_id,user_id) VALUES (cid,uid),(cid,_other_user);
  END IF;
  RETURN jsonb_build_object('conversation_id', cid);
END; $$;

CREATE OR REPLACE FUNCTION public.create_group_conversation(_title text, _members uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cid uuid; m uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.has_active_subscription(uid) THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  IF _members IS NULL OR array_length(_members,1) IS NULL THEN RETURN jsonb_build_object('error','no_members'); END IF;
  INSERT INTO public.conversations (title,is_group,created_by) VALUES (COALESCE(NULLIF(_title,''),'Group discussion'), true, uid) RETURNING id INTO cid;
  INSERT INTO public.conversation_participants (conversation_id,user_id) VALUES (cid,uid);
  FOREACH m IN ARRAY _members LOOP
    IF m <> uid AND public.has_active_subscription(m) THEN
      INSERT INTO public.conversation_participants (conversation_id,user_id) VALUES (cid,m) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('conversation_id', cid);
END; $$;

CREATE OR REPLACE FUNCTION public.send_message(_conversation_id uuid, _body text, _attachment_path text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); mid uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF NOT public.has_active_subscription(uid) THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF;
  IF NOT public.is_conversation_member(_conversation_id, uid) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  IF EXISTS (SELECT 1 FROM public.member_profiles WHERE user_id=uid AND communication_blocked) THEN
    RETURN jsonb_build_object('error','communication_blocked');
  END IF;
  INSERT INTO public.messages (conversation_id,sender_id,body,attachment_path)
  VALUES (_conversation_id, uid, COALESCE(_body,''), _attachment_path) RETURNING id INTO mid;
  UPDATE public.conversations SET last_message_at = now() WHERE id = _conversation_id;
  INSERT INTO public.notifications (user_id,title,body,kind)
  SELECT p.user_id, 'New message', left(COALESCE(_body,'Attachment'),120), 'info'
  FROM public.conversation_participants p WHERE p.conversation_id=_conversation_id AND p.user_id <> uid;
  RETURN jsonb_build_object('message_id', mid);
END; $$;

CREATE OR REPLACE FUNCTION public.my_conversations()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'last_message_at' DESC) FROM (
      SELECT jsonb_build_object(
        'id', c.id, 'is_group', c.is_group,
        'title', COALESCE(c.title, (SELECT mp.full_name FROM public.conversation_participants p2
                                     JOIN public.member_profiles mp ON mp.user_id=p2.user_id
                                     WHERE p2.conversation_id=c.id AND p2.user_id<>uid LIMIT 1), 'Member'),
        'avatar', (SELECT mp.photo_url FROM public.conversation_participants p3
                   JOIN public.member_profiles mp ON mp.user_id=p3.user_id
                   WHERE p3.conversation_id=c.id AND p3.user_id<>uid LIMIT 1),
        'other_user_id', (SELECT p4.user_id FROM public.conversation_participants p4
                          WHERE p4.conversation_id=c.id AND p4.user_id<>uid LIMIT 1),
        'participants', (SELECT count(*) FROM public.conversation_participants p5 WHERE p5.conversation_id=c.id),
        'last_message', (SELECT left(m.body,90) FROM public.messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1),
        'last_message_at', c.last_message_at,
        'unread', (SELECT count(*) FROM public.messages m WHERE m.conversation_id=c.id AND m.sender_id<>uid AND m.created_at > p.last_read_at)
      ) AS x
      FROM public.conversations c
      JOIN public.conversation_participants p ON p.conversation_id=c.id AND p.user_id=uid
    ) s), '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.conversation_messages(_conversation_id uuid, _limit int DEFAULT 60)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.is_conversation_member(_conversation_id, uid) THEN RETURN '[]'::jsonb; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'created_at') FROM (
      SELECT jsonb_build_object('id', m.id, 'body', m.body, 'attachment_path', m.attachment_path,
        'sender_id', m.sender_id, 'sender_name', COALESCE(mp.full_name,'Member'),
        'created_at', m.created_at, 'mine', m.sender_id = uid) AS x
      FROM public.messages m LEFT JOIN public.member_profiles mp ON mp.user_id=m.sender_id
      WHERE m.conversation_id=_conversation_id
      ORDER BY m.created_at DESC LIMIT LEAST(COALESCE(_limit,60),200)
    ) s), '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.network_admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  RETURN jsonb_build_object(
    'total_subscribers', (SELECT count(*) FROM public.subscriptions),
    'active_subscribers', (SELECT count(*) FROM public.subscriptions WHERE status='active'),
    'total_profiles', (SELECT count(*) FROM public.member_profiles),
    'approved_profiles', (SELECT count(*) FROM public.member_profiles WHERE status='approved'),
    'suspended_profiles', (SELECT count(*) FROM public.member_profiles WHERE status='suspended'),
    'total_enquiries', (SELECT count(*) FROM public.member_enquiries),
    'active_enquiries', (SELECT count(*) FROM public.member_enquiries WHERE status='active'),
    'total_connections', (SELECT count(*) FROM public.connection_requests WHERE status='accepted'),
    'total_messages', (SELECT count(*) FROM public.messages),
    'total_calls', (SELECT count(*) FROM public.member_calls),
    'open_reports', (SELECT count(*) FROM public.member_reports WHERE status='open'),
    'top_categories', COALESCE((SELECT jsonb_agg(jsonb_build_object('category',category,'count',n) ORDER BY n DESC)
       FROM (SELECT category, count(*) n FROM public.member_profiles WHERE category <> '' GROUP BY category ORDER BY n DESC LIMIT 8) t), '[]'::jsonb)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_member_status(_user_id uuid, _status public.member_status, _blocked boolean DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN jsonb_build_object('error','forbidden'); END IF;
  UPDATE public.member_profiles SET status=_status,
         communication_blocked = COALESCE(_blocked, communication_blocked), updated_at = now()
   WHERE user_id=_user_id;
  INSERT INTO public.audit_logs (user_id,action,entity,entity_id,meta)
  VALUES (auth.uid(),'member.status','member_profiles',_user_id::text, jsonb_build_object('status',_status));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.my_network_access()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('authenticated',false,'active',false,'has_profile',false); END IF;
  RETURN jsonb_build_object(
    'authenticated', true,
    'active', public.has_active_subscription(uid) OR public.is_admin(uid),
    'is_admin', public.is_admin(uid),
    'has_profile', EXISTS (SELECT 1 FROM public.member_profiles WHERE user_id=uid),
    'blocked', EXISTS (SELECT 1 FROM public.member_profiles WHERE user_id=uid AND communication_blocked)
  );
END; $$;


-- ============ 0006_member_media_storage_policies.sql ============
CREATE POLICY "member media upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'member-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "member media update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'member-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'member-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "member media read subscribers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-media'
         AND ((storage.foldername(name))[1] = auth.uid()::text
              OR public.has_active_subscription(auth.uid())
              OR public.is_admin(auth.uid())));


-- ============ 0007_phone_otp_verification.sql ============
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


-- ============ 0008_add_documentation_services.sql ============
INSERT INTO public.services (name, category, description, original_price)
SELECT v.name, 'Documentation Services', v.description, v.original_price
FROM (VALUES
  ('House Loan Estimate', 'House loan estimate documentation assistance for property buyers.', 1500),
  ('Patta & Chitta', 'Patta and Chitta land record documentation services.', 1200),
  ('Document Copy', 'Certified document copy assistance for property and legal records.', 500),
  ('Encumbrance Certificate', 'Encumbrance certificate application and documentation support.', 1000),
  ('Rental Contract Agreement (Unregistered)', 'Unregistered rental contract agreement drafting and documentation.', 800),
  ('Home Loan Assistance', 'Home loan documentation and application assistance.', 2000),
  ('Rectification Deed', 'Rectification deed drafting and registration support.', 2500),
  ('Lease Agreement', 'Lease agreement drafting and documentation services.', 1500),
  ('Partition Deed', 'Partition deed drafting and registration assistance.', 3000),
  ('Cancellation Deed', 'Cancellation deed drafting and registration support.', 2500),
  ('General Power of Attorney', 'General power of attorney drafting and documentation.', 2000),
  ('Agreement Deed', 'Agreement deed drafting and documentation services.', 1800),
  ('Receipt Document', 'Receipt document drafting and documentation.', 600),
  ('Will Deed', 'Will deed drafting and registration assistance.', 3000),
  ('Release Deed', 'Release deed drafting and registration support.', 2500),
  ('Registered Rental Agreement', 'Registered rental agreement drafting and registration.', 1800)
) AS v(name, description, original_price)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.name = v.name AND s.category = 'Documentation Services'
);


-- ============ 0009_razorpay_plan_change.sql ============
-- Plan changes are paid through Razorpay against the subscription the user
-- already has. The target plan is only moved onto the subscription once the
-- payment is captured, so an abandoned checkout never changes the live plan.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pending_plan_code text;


-- ============ 0010_remove_gst_at_checkout.sql ============
-- Temporarily disable GST in the checkout quote. GST can be re-enabled later by
-- setting the gst_percentage setting back (e.g. 18) or restoring the default.
UPDATE public.settings SET value = '0' WHERE key = 'gst_percentage';

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

  gst_pct := public.setting_num('gst_percentage', 0);
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


-- ============ 0011_charge_plan_price_only.sql ============
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


-- ============ 0012_payments_pending_plan_code.sql ============
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pending_plan_code text;


-- ============ 0013_add_mortgage_deed_service.sql ============
INSERT INTO public.services (category, name, description, original_price)
SELECT 'Documentation Services', 'Mortgage Deed', 'Mortgage deed drafting and registration assistance.', 3000
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Mortgage Deed');


-- ============ 0014_restrict_public_directory_and_opportunity_reads.sql ============
-- Only published/available listings belong in public browsing.
-- Existing admin policies continue to permit management of hidden listings.
-- Business phone column grants and subscription-gated contact unlocks are unchanged.
ALTER POLICY "bc public read" ON public.business_contacts
  TO anon, authenticated
  USING (status = 'available');

ALTER POLICY "opps public read" ON public.opportunities
  TO anon, authenticated
  USING (status = 'available');


-- ============ 0015_monthly_loan_rotation.sql ============
CREATE OR REPLACE FUNCTION public.lead_phone_key(_phone text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE WHEN length(d)=12 AND left(d,2)='91' THEN right(d,10) WHEN length(d)=11 AND left(d,1)='0' THEN right(d,10) ELSE d END FROM (SELECT regexp_replace(coalesce(_phone,''),'[^0-9]','','g') d) x $$;
CREATE TABLE public.lead_identities (phone_key text PRIMARY KEY, lead_id uuid NOT NULL);
GRANT SELECT ON public.lead_identities TO authenticated;
GRANT ALL ON public.lead_identities TO service_role;
ALTER TABLE public.lead_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "identity admin read" ON public.lead_identities FOR SELECT TO authenticated USING(public.is_admin(auth.uid()));
INSERT INTO public.lead_identities(phone_key,lead_id) SELECT DISTINCT ON (public.lead_phone_key(phone)) public.lead_phone_key(phone),id FROM public.leads WHERE length(public.lead_phone_key(phone))>=10 ORDER BY public.lead_phone_key(phone),created_at,id;
CREATE OR REPLACE FUNCTION public.guard_lead_identity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE k text:=public.lead_phone_key(NEW.phone); BEGIN IF length(k)<10 OR length(k)>15 THEN RAISE EXCEPTION 'Invalid phone number'; END IF; IF TG_OP='UPDATE' AND public.lead_phone_key(OLD.phone) IS DISTINCT FROM k THEN RAISE EXCEPTION 'Lead phone identity cannot be changed'; END IF; IF TG_OP='INSERT' THEN INSERT INTO public.lead_identities(phone_key,lead_id) VALUES(k,NEW.id); END IF; RETURN NEW; END $$;
CREATE TRIGGER lead_identity_guard BEFORE INSERT OR UPDATE OF phone ON public.leads FOR EACH ROW EXECUTE FUNCTION public.guard_lead_identity();
CREATE TABLE public.executive_lead_history (user_id uuid NOT NULL,phone_key text NOT NULL,lead_id uuid NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,phone_key));
GRANT SELECT ON public.executive_lead_history TO authenticated;
GRANT ALL ON public.executive_lead_history TO service_role;
ALTER TABLE public.executive_lead_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history own or admin" ON public.executive_lead_history FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin(auth.uid()));
INSERT INTO public.executive_lead_history(user_id,phone_key,lead_id,received_at) SELECT DISTINCT ON (a.user_id,public.lead_phone_key(l.phone)) a.user_id,public.lead_phone_key(l.phone),l.id,a.allocated_at FROM public.lead_allocations a JOIN public.leads l ON l.id=a.lead_id ORDER BY a.user_id,public.lead_phone_key(l.phone),a.allocated_at;
CREATE OR REPLACE FUNCTION public.record_executive_lead() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.executive_lead_history(user_id,phone_key,lead_id) SELECT NEW.user_id,public.lead_phone_key(phone),id FROM public.leads WHERE id=NEW.lead_id; RETURN NEW; END $$;
CREATE TRIGGER record_executive_lead AFTER INSERT ON public.lead_allocations FOR EACH ROW EXECUTE FUNCTION public.record_executive_lead();
CREATE OR REPLACE FUNCTION public.protect_lead_history() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Permanent executive lead history cannot be modified or deleted'; END $$;
CREATE TRIGGER permanent_lead_history BEFORE UPDATE OR DELETE ON public.executive_lead_history FOR EACH ROW EXECUTE FUNCTION public.protect_lead_history();
CREATE TABLE public.lead_credit_periods (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),period_start timestamptz NOT NULL,period_end timestamptz NOT NULL,quota integer NOT NULL,used integer NOT NULL DEFAULT 0,UNIQUE(subscription_id,period_start),CHECK(quota IN (3,10,50)),CHECK(used>=0 AND used<=quota));
GRANT SELECT ON public.lead_credit_periods TO authenticated;
GRANT ALL ON public.lead_credit_periods TO service_role;
ALTER TABLE public.lead_credit_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits own or admin" ON public.lead_credit_periods FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.monthly_lead_quota(_code text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE _code WHEN 'starter' THEN 3 WHEN 'business' THEN 10 WHEN 'premium' THEN 50 ELSE 0 END $$;
CREATE OR REPLACE FUNCTION public.sync_lead_credit_period() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE q int; BEGIN IF NEW.status='active' AND NEW.start_date IS NOT NULL AND NEW.renewal_date>NEW.start_date THEN SELECT public.monthly_lead_quota(code) INTO q FROM public.plans WHERE id=NEW.plan_id; IF q>0 THEN INSERT INTO public.lead_credit_periods(user_id,subscription_id,period_start,period_end,quota) VALUES(NEW.user_id,NEW.id,NEW.start_date,NEW.renewal_date,q) ON CONFLICT(subscription_id,period_start) DO NOTHING; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER subscription_lead_credits AFTER INSERT OR UPDATE OF status,start_date,renewal_date,plan_id ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_lead_credit_period();
INSERT INTO public.lead_credit_periods(user_id,subscription_id,period_start,period_end,quota,used) SELECT s.user_id,s.id,s.start_date,s.renewal_date,public.monthly_lead_quota(p.code),least(s.leads_used,public.monthly_lead_quota(p.code)) FROM public.subscriptions s JOIN public.plans p ON p.id=s.plan_id WHERE s.status='active' AND s.start_date IS NOT NULL AND s.renewal_date>s.start_date AND public.monthly_lead_quota(p.code)>0;
CREATE TABLE public.lead_import_batches (id uuid PRIMARY KEY,admin_id uuid NOT NULL,filename text NOT NULL,record_offset integer NOT NULL,imported integer NOT NULL DEFAULT 0,duplicates integer NOT NULL DEFAULT 0,invalid integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.lead_import_batches TO authenticated;
GRANT ALL ON public.lead_import_batches TO service_role;
ALTER TABLE public.lead_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imports admin read" ON public.lead_import_batches FOR SELECT TO authenticated USING(public.is_admin(auth.uid()));
ALTER TABLE public.leads ADD COLUMN extra_details jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.import_loan_leads(_batch_id uuid,_filename text,_offset integer,_rows jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; n int:=0; d int:=0; bad int:=0; b public.lead_import_batches%ROWTYPE; ph text; amount numeric; BEGIN IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Administrator access required'; END IF; IF jsonb_typeof(_rows)<>'array' OR jsonb_array_length(_rows)>500 THEN RAISE EXCEPTION 'Maximum 500 rows per batch'; END IF; PERFORM pg_advisory_xact_lock(hashtextextended(_batch_id::text,0)); SELECT * INTO b FROM public.lead_import_batches WHERE id=_batch_id; IF FOUND THEN RETURN to_jsonb(b); END IF; FOR r IN SELECT value FROM jsonb_array_elements(_rows) LOOP ph:=public.lead_phone_key(r->>'phone'); IF length(ph)<10 OR length(ph)>15 THEN bad:=bad+1; CONTINUE; END IF; BEGIN amount:=nullif(r->>'estimated_amount','')::numeric; IF amount<0 THEN bad:=bad+1; CONTINUE; END IF; INSERT INTO public.leads(name,phone,location,loan_type,requirement,estimated_amount,eligibility,source,is_demo,extra_details) VALUES(coalesce(nullif(trim(r->>'name'),''),'Loan enquiry'),ph,r->>'location',r->>'loan_type',r->>'requirement',amount,r->>'eligibility',left(_filename,200),false,coalesce(r->'extra_details','{}'::jsonb)); n:=n+1; EXCEPTION WHEN unique_violation THEN d:=d+1; WHEN invalid_text_representation OR numeric_value_out_of_range THEN bad:=bad+1; END; END LOOP; INSERT INTO public.lead_import_batches(id,admin_id,filename,record_offset,imported,duplicates,invalid) VALUES(_batch_id,auth.uid(),left(_filename,200),_offset,n,d,bad) RETURNING * INTO b; INSERT INTO public.audit_logs(user_id,action,entity,meta) VALUES(auth.uid(),'lead.import','leads',jsonb_build_object('imported',n,'duplicates',d,'invalid',bad)); RETURN to_jsonb(b); END $$;
CREATE OR REPLACE FUNCTION public.claim_leads() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid:=auth.uid(); s public.subscriptions%ROWTYPE; c public.lead_credit_periods%ROWTYPE; got int:=0; n int; f int; reused int; ids uuid[]; BEGIN IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF; IF NOT public.is_phone_verified(uid) THEN RETURN jsonb_build_object('error','phone_not_verified'); END IF; PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0)); SELECT * INTO s FROM public.subscriptions WHERE user_id=uid AND status='active' AND start_date<=now() AND renewal_date>now() ORDER BY start_date DESC LIMIT 1 FOR UPDATE; IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF; SELECT * INTO c FROM public.lead_credit_periods WHERE subscription_id=s.id AND period_start=s.start_date AND period_end>now() FOR UPDATE; IF NOT FOUND THEN RETURN jsonb_build_object('error','no_active_subscription'); END IF; n:=c.quota-c.used; IF n<=0 THEN RETURN jsonb_build_object('error','lead_limit_reached'); END IF;
WITH eligible AS (SELECT l.id,i.phone_key,EXISTS(SELECT 1 FROM public.executive_lead_history h WHERE h.phone_key=i.phone_key) AS recycled FROM public.lead_identities i JOIN public.leads l ON l.id=i.lead_id WHERE NOT l.is_demo AND l.status IN ('new','assigned','contacted') AND NOT EXISTS(SELECT 1 FROM public.executive_lead_history h WHERE h.user_id=uid AND h.phone_key=i.phone_key)), ranked AS (SELECT *,row_number() OVER(PARTITION BY recycled ORDER BY random()) rn,count(*) OVER(PARTITION BY recycled) cnt FROM eligible), selected AS (SELECT * FROM ranked WHERE recycled OR rn<cnt ORDER BY CASE WHEN rn<=ceil(n/2.0) THEN 0 ELSE 1 END,rn,recycled LIMIT n) SELECT array_agg(id),count(*) FILTER(WHERE NOT recycled),count(*) FILTER(WHERE recycled) INTO ids,f,reused FROM selected;
IF ids IS NULL THEN RETURN jsonb_build_object('error','no_leads'); END IF; INSERT INTO public.lead_allocations(lead_id,user_id,plan_id) SELECT unnest(ids),uid,s.plan_id; GET DIAGNOSTICS got=ROW_COUNT; UPDATE public.lead_credit_periods SET used=used+got WHERE id=c.id; UPDATE public.subscriptions SET leads_used=c.used+got WHERE id=s.id; INSERT INTO public.audit_logs(user_id,action,entity,meta) VALUES(uid,'lead.claim','lead_allocations',jsonb_build_object('count',got,'fresh',f,'rotated',reused,'period',c.id)); RETURN jsonb_build_object('allocated',got,'remaining',n-got,'fresh',f,'rotated',reused); END $$;
CREATE OR REPLACE FUNCTION public.my_loan_credits() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT jsonb_build_object('status',s.status,'period_start',c.period_start,'period_end',c.period_end,'quota',c.quota,'used',c.used,'remaining',CASE WHEN s.status='active' AND c.period_end>now() THEN c.quota-c.used ELSE 0 END,'active',s.status='active' AND c.period_start<=now() AND c.period_end>now()) FROM public.lead_credit_periods c JOIN public.subscriptions s ON s.id=c.subscription_id WHERE c.user_id=auth.uid() ORDER BY c.period_start DESC LIMIT 1),'{}'::jsonb) $$;
CREATE OR REPLACE FUNCTION public.admin_loan_inventory() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Administrator access required'; END IF; RETURN jsonb_build_object('total',(SELECT count(*) FROM public.lead_identities i JOIN public.leads l ON l.id=i.lead_id WHERE NOT l.is_demo),'available',(SELECT count(*) FROM public.lead_identities i JOIN public.leads l ON l.id=i.lead_id WHERE NOT l.is_demo AND l.status IN ('new','assigned','contacted')),'fresh',(SELECT count(*) FROM public.lead_identities i JOIN public.leads l ON l.id=i.lead_id WHERE NOT l.is_demo AND l.status IN ('new','assigned','contacted') AND NOT EXISTS(SELECT 1 FROM public.executive_lead_history h WHERE h.phone_key=i.phone_key)),'distributed',(SELECT count(*) FROM public.executive_lead_history)); END $$;
CREATE OR REPLACE FUNCTION public.download_my_loan_leads(_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE rows jsonb; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF; IF NOT public.is_phone_verified(auth.uid()) THEN RAISE EXCEPTION 'Verify your phone first'; END IF; IF cardinality(_ids)>500 THEN RAISE EXCEPTION 'Download at most 500 allocated leads at a time'; END IF; SELECT coalesce(jsonb_agg(jsonb_build_object('Lead ID',l.lead_code,'Name',l.name,'Phone',l.phone,'Location',l.location,'Loan Type',l.loan_type,'Requirement',l.requirement,'Estimated Amount',l.estimated_amount,'Eligibility',l.eligibility,'Additional Details',l.extra_details,'Allocated',a.allocated_at)),'[]'::jsonb) INTO rows FROM public.lead_allocations a JOIN public.leads l ON l.id=a.lead_id WHERE a.user_id=auth.uid() AND a.id=ANY(_ids); INSERT INTO public.audit_logs(user_id,action,entity,meta) VALUES(auth.uid(),'lead.download','lead_allocations',jsonb_build_object('count',jsonb_array_length(rows))); RETURN rows; END $$;
REVOKE ALL ON FUNCTION public.import_loan_leads(uuid,text,integer,jsonb),public.my_loan_credits(),public.admin_loan_inventory(),public.download_my_loan_leads(uuid[]),public.claim_leads() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.import_loan_leads(uuid,text,integer,jsonb),public.my_loan_credits(),public.admin_loan_inventory(),public.download_my_loan_leads(uuid[]),public.claim_leads() TO authenticated;


-- ============ 0016_loan_rotation_indexes_and_reserve.sql ============
CREATE INDEX executive_lead_history_phone_idx ON public.executive_lead_history(phone_key);
CREATE INDEX lead_allocations_user_time_idx ON public.lead_allocations(user_id,allocated_at DESC);
CREATE OR REPLACE FUNCTION public.serialize_loan_claim() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN PERFORM pg_advisory_xact_lock(hashtextextended('prince-loan-rotation',0)); RETURN NEW; END $$;
CREATE TRIGGER serialize_loan_distribution BEFORE INSERT ON public.lead_allocations FOR EACH STATEMENT EXECUTE FUNCTION public.serialize_loan_claim();
CREATE OR REPLACE FUNCTION public.admin_executive_lead_totals() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Administrator access required'; END IF; RETURN coalesce((SELECT jsonb_agg(x ORDER BY x.total DESC) FROM (SELECT h.user_id,coalesce(p.name,'Executive') as name,count(*) as total,max(h.received_at) as latest FROM public.executive_lead_history h LEFT JOIN public.profiles p ON p.id=h.user_id GROUP BY h.user_id,p.name) x),'[]'::jsonb); END $$;
REVOKE ALL ON FUNCTION public.admin_executive_lead_totals() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_executive_lead_totals() TO authenticated;


-- ============ 0017_member_catalog_and_current_subscription_access.sql ============
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


-- ============ 0018_disambiguate_member_catalog_availability.sql ============
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


-- ============ 0019_enforce_current_plan_checkout_and_manual_allocation_limits.sql ============
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


-- ============ 0020_atomic_captured_subscription_activation.sql ============
CREATE OR REPLACE FUNCTION public.activate_captured_subscription(_order_id text,_payment_id text,_amount_paise bigint,_currency text,_provider_status text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE pay public.payments%ROWTYPE; sub public.subscriptions%ROWTYPE; target uuid; activated timestamptz:=now(); BEGIN IF _provider_status IS DISTINCT FROM 'captured' OR _currency IS DISTINCT FROM 'INR' OR nullif(_payment_id,'') IS NULL THEN RAISE EXCEPTION 'Captured INR payment confirmation required'; END IF; SELECT * INTO pay FROM public.payments WHERE razorpay_order_id=_order_id FOR UPDATE; IF NOT FOUND THEN RETURN jsonb_build_object('updated',false); END IF; IF _amount_paise IS DISTINCT FROM round(pay.total_amount*100)::bigint THEN RAISE EXCEPTION 'Confirmed payment amount does not match the stored order'; END IF; IF pay.status='success' THEN RETURN jsonb_build_object('updated',true,'already_confirmed',true); END IF; SELECT * INTO sub FROM public.subscriptions WHERE id=pay.subscription_id AND user_id=pay.user_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Payment subscription not found'; END IF; target:=sub.plan_id; IF pay.pending_plan_code IS NOT NULL THEN SELECT id INTO target FROM public.plans WHERE code=pay.pending_plan_code; IF NOT FOUND THEN RAISE EXCEPTION 'Selected subscription plan not found'; END IF; END IF; UPDATE public.subscriptions SET plan_id=target,status='active',start_date=activated,renewal_date=activated+interval '1 month',leads_used=0 WHERE id=sub.id; UPDATE public.payments SET status='success',razorpay_payment_id=_payment_id,paid_at=activated WHERE id=pay.id; INSERT INTO public.audit_logs(user_id,action,entity,entity_id,meta) VALUES(pay.user_id,'subscription.payment_captured','payments',pay.id::text,jsonb_build_object('plan_id',target,'amount_paise',_amount_paise)); RETURN jsonb_build_object('updated',true,'already_confirmed',false); END $$; REVOKE ALL ON FUNCTION public.activate_captured_subscription(text,text,bigint,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.activate_captured_subscription(text,text,bigint,text,text) TO service_role;


-- ============ 0021_remove_prepayment_phone_check.sql ============
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

