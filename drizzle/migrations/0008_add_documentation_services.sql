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