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