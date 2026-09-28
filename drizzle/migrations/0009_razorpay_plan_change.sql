-- Plan changes are paid through Razorpay against the subscription the user
-- already has. The target plan is only moved onto the subscription once the
-- payment is captured, so an abandoned checkout never changes the live plan.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pending_plan_code text;
