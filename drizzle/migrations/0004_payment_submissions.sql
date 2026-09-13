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