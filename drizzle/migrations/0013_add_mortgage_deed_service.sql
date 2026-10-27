INSERT INTO public.services (category, name, description, original_price)
SELECT 'Documentation Services', 'Mortgage Deed', 'Mortgage deed drafting and registration assistance.', 3000
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Mortgage Deed');