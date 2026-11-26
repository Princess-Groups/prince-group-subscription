CREATE OR REPLACE FUNCTION public.is_phone_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT _user_id IS NOT NULL $$;