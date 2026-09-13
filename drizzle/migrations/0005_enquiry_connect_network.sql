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
    'full_name', CASE WHEN sub THEN full_name ELSE split_part(full_name,' ',1) || ' ••••' END,
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
      'description', CASE WHEN sub THEN e.description ELSE left(e.description, 90) || '…' END,
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
