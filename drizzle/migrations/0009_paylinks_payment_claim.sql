ALTER TABLE public.pay_orders ADD COLUMN paylink_request_id text;
CREATE UNIQUE INDEX pay_orders_paylink_request_unique ON public.pay_orders (paylink_request_id) WHERE paylink_request_id IS NOT NULL;