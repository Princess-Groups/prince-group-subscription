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
('december','December Exclusive – Save 10% on Annual Plan','Automatically applied during the configured December campaign window.',10,'2026-12-01','2026-12-31','premium'),
('loan_client','One of the Best Subscription Plans for Loan Clients','33% OFF for first month. First month ₹99 + GST, next month ₹10 + GST.',33,NULL,NULL,'business');

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