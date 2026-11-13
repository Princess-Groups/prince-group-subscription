-- Only published/available listings belong in public browsing.
-- Existing admin policies continue to permit management of hidden listings.
-- Business phone column grants and subscription-gated contact unlocks are unchanged.
ALTER POLICY "bc public read" ON public.business_contacts
  TO anon, authenticated
  USING (status = 'available');

ALTER POLICY "opps public read" ON public.opportunities
  TO anon, authenticated
  USING (status = 'available');