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
