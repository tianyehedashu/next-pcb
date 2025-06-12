-- Filename: handle_payment_success.sql
-- Description: Creates a transaction function to atomically update order statuses upon successful payment.

CREATE OR REPLACE FUNCTION public.handle_payment_success(p_payment_intent_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_quote_id BIGINT;
  v_admin_order_id BIGINT;
BEGIN
  -- Step 1: Find the quote and admin_order IDs based on the payment_intent_id
  SELECT id, ao.id INTO v_quote_id, v_admin_order_id
  FROM public.pcb_quotes
  JOIN public.admin_orders ao ON ao.user_order_id = public.pcb_quotes.id
  WHERE payment_intent_id = p_payment_intent_id
  LIMIT 1;

  -- If no order is found, raise an error to stop execution
  IF v_quote_id IS NULL OR v_admin_order_id IS NULL THEN
    RAISE WARNING 'No order found for payment_intent_id: %', p_payment_intent_id;
    RETURN;
  END IF;

  -- Step 2: Update admin_orders table
  UPDATE public.admin_orders
  SET
    payment_status = 'paid',
    order_status = 'paid',
    payment_method = 'stripe',
    paid_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_admin_order_id;

  -- Step 3: Update pcb_quotes table
  UPDATE public.pcb_quotes
  SET
    status = 'paid', -- Using a simplified status consistent with admin_orders
    updated_at = timezone('utc'::text, now())
  WHERE id = v_quote_id;

  -- The function completes successfully, transaction will be committed.
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_payment_success(TEXT)
IS 'Handles the successful payment of an order by updating both admin_orders and pcb_quotes tables within a single transaction.'; 