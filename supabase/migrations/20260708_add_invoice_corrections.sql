-- =============================================================================
-- Migración SQL: Corrección de Documentos (Notas de Crédito/Débito SII Chile)
-- 2026-07-08
--
-- Agrega columnas de relación a `invoices` y actualiza las funciones RPC
-- public.create_draft_invoice_with_customer y public.issue_invoice_secure.
-- =============================================================================

-- 1. Añadir columnas a invoices si no existen
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS referenced_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_code integer,
  ADD COLUMN IF NOT EXISTS reference_reason text;

-- 2. Modificar RPC public.create_draft_invoice_with_customer para soportar Nota de Crédito/Débito
CREATE OR REPLACE FUNCTION public.create_draft_invoice_with_customer(
  customer_name text,
  customer_rut text,
  customer_email text,
  issue_date date,
  due_date date,
  invoice_currency text default 'CLP',
  invoice_notes text default null,
  invoice_tax_rate numeric default 0.19,
  invoice_items jsonb default '[]'::jsonb,
  invoice_dte_type integer default 33,
  ref_invoice_id uuid default null,
  ref_code integer default null,
  ref_reason text default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  current_customer public.customers%rowtype;
  created_invoice public.invoices%rowtype;
  item jsonb;
  subtotal_value numeric(14,2) := 0;
  tax_value numeric(14,2) := 0;
  total_value numeric(14,2) := 0;
  qty_value numeric(14,2);
  unit_price_value numeric(14,2);
  line_total_value numeric(14,2);
  product_id_value uuid;
  normalized_rut text;
  generated_number text;
  prefix text := 'FV-';
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found.';
  END IF;

  SELECT *
  INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for current user.';
  END IF;

  normalized_rut := upper(regexp_replace(trim(coalesce(customer_rut, '')), '\s+', '', 'g'));

  IF jsonb_typeof(invoice_items) <> 'array' OR jsonb_array_length(invoice_items) = 0 THEN
    RAISE EXCEPTION 'Invoice items are required.';
  END IF;

  SELECT *
  INTO current_customer
  FROM public.customers
  WHERE tenant_id = current_profile.tenant_id
    AND rut = normalized_rut
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.customers (
      tenant_id,
      name,
      rut,
      email,
      created_by
    )
    VALUES (
      current_profile.tenant_id,
      trim(customer_name),
      normalized_rut,
      nullif(trim(coalesce(customer_email, '')), ''),
      current_user_id
    )
    RETURNING *
    INTO current_customer;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(invoice_items)
  LOOP
    qty_value := (item ->> 'qty')::numeric;
    unit_price_value := (item ->> 'unitPrice')::numeric;
    line_total_value := round(qty_value * unit_price_value, 2);
    subtotal_value := subtotal_value + line_total_value;
  END LOOP;

  subtotal_value := round(subtotal_value, 2);
  tax_value := round(subtotal_value * coalesce(invoice_tax_rate, 0.19), 2);
  total_value := round(subtotal_value + tax_value, 2);

  -- Definir prefijo según Tipo DTE
  IF invoice_dte_type = 61 THEN
    prefix := 'NC-';
  ELSIF invoice_dte_type = 56 THEN
    prefix := 'ND-';
  ELSIF invoice_dte_type = 39 THEN
    prefix := 'BL-';
  END IF;

  generated_number := prefix || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.invoices (
    tenant_id,
    customer_id,
    number,
    issue_date,
    due_date,
    currency,
    notes,
    subtotal,
    tax,
    total,
    status,
    created_by,
    dte_type,
    referenced_invoice_id,
    reference_code,
    reference_reason
  )
  VALUES (
    current_profile.tenant_id,
    current_customer.id,
    generated_number,
    issue_date,
    due_date,
    coalesce(nullif(trim(coalesce(invoice_currency, '')), ''), 'CLP'),
    nullif(trim(coalesce(invoice_notes, '')), ''),
    subtotal_value,
    tax_value,
    total_value,
    'draft',
    current_user_id,
    coalesce(invoice_dte_type, 33),
    ref_invoice_id,
    ref_code,
    ref_reason
  )
  RETURNING *
  INTO created_invoice;

  FOR item IN SELECT * FROM jsonb_array_elements(invoice_items)
  LOOP
    qty_value := (item ->> 'qty')::numeric;
    unit_price_value := (item ->> 'unitPrice')::numeric;
    line_total_value := round(qty_value * unit_price_value, 2);
    product_id_value := CASE
      WHEN nullif(item ->> 'productId', '') IS NULL THEN NULL
      ELSE (item ->> 'productId')::uuid
    END;

    INSERT INTO public.invoice_items (
      tenant_id,
      invoice_id,
      product_id,
      description,
      qty,
      unit_price,
      line_total
    )
    VALUES (
      current_profile.tenant_id,
      created_invoice.id,
      product_id_value,
      trim(coalesce(item ->> 'description', '')),
      qty_value,
      unit_price_value,
      line_total_value
    );
  END LOOP;

  RETURN created_invoice.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_draft_invoice_with_customer(text, text, text, date, date, text, text, numeric, jsonb, integer, uuid, integer, text) TO authenticated;

-- 3. Modificar RPC public.issue_invoice_secure para ajustar saldos al emitir Notas de Crédito/Débito
CREATE OR REPLACE FUNCTION public.issue_invoice_secure(target_invoice_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice public.invoices%rowtype;
  target_receivable public.accounts_receivable%rowtype;
  next_balance numeric(14,2);
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found.';
  END IF;

  SELECT *
  INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for current user.';
  END IF;

  SELECT *
  INTO target_invoice
  FROM public.invoices
  WHERE id = target_invoice_id
    AND tenant_id = current_profile.tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF target_invoice.status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be issued.';
  END IF;

  -- Actualizar estado del documento actual a emitido
  UPDATE public.invoices
  SET status = 'issued',
      updated_at = now()
  WHERE id = target_invoice.id;

  -- Procesar cuentas por cobrar según el tipo de DTE
  IF target_invoice.dte_type = 61 THEN
    -- Nota de Crédito: Reduce la cuenta por cobrar del documento referenciado
    IF target_invoice.referenced_invoice_id IS NOT NULL THEN
      IF target_invoice.reference_code IN (1, 3) THEN
        SELECT * INTO target_receivable
        from public.accounts_receivable
        WHERE invoice_id = target_invoice.referenced_invoice_id;

        IF FOUND THEN
          next_balance := round(target_receivable.balance - target_invoice.total, 2);
          IF next_balance < 0 THEN
            next_balance := 0;
          END IF;

          UPDATE public.accounts_receivable
          SET balance = next_balance,
              status = CASE WHEN next_balance = 0 THEN 'settled'::public.receivable_status ELSE 'partial'::public.receivable_status END,
              updated_at = now()
          WHERE id = target_receivable.id;

          -- Si es anulación completa (código 1), cambiar estado de factura original a cancelled.
          -- Si no, ajustar a paid (si balance es 0) o mantener en partially_paid
          UPDATE public.invoices
          SET status = CASE 
                         WHEN target_invoice.reference_code = 1 THEN 'cancelled'::public.invoice_status 
                         WHEN next_balance = 0 THEN 'paid'::public.invoice_status 
                         ELSE 'partially_paid'::public.invoice_status 
                       END,
              updated_at = now()
          WHERE id = target_invoice.referenced_invoice_id;
        END IF;
      END IF;
    END IF;
  ELSIF target_invoice.dte_type = 56 THEN
    -- Nota de Débito: Incrementa la cuenta por cobrar del documento referenciado
    IF target_invoice.referenced_invoice_id IS NOT NULL THEN
      SELECT * INTO target_receivable
      from public.accounts_receivable
      WHERE invoice_id = target_invoice.referenced_invoice_id;

      IF FOUND THEN
        next_balance := round(target_receivable.balance + target_invoice.total, 2);

        UPDATE public.accounts_receivable
        SET balance = next_balance,
            status = 'open'::public.receivable_status,
            updated_at = now()
        WHERE id = target_receivable.id;

        UPDATE public.invoices
        SET status = 'issued'::public.invoice_status,
            updated_at = now()
        WHERE id = target_invoice.referenced_invoice_id;
      END IF;
    END IF;
  ELSE
    -- Factura (33) o Boleta (39): Crear/actualizar cuenta por cobrar estándar
    INSERT INTO public.accounts_receivable (
      tenant_id,
      invoice_id,
      balance,
      status,
      due_date
    )
    VALUES (
      current_profile.tenant_id,
      target_invoice.id,
      target_invoice.total,
      'open',
      target_invoice.due_date
    )
    ON CONFLICT (invoice_id)
    DO UPDATE
    SET balance = excluded.balance,
        status = excluded.status,
        due_date = excluded.due_date,
        updated_at = now();
  END IF;

  RETURN target_invoice.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_invoice_secure(uuid) TO authenticated;

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
