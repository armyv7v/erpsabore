create or replace function public.create_draft_invoice_with_customer(
  customer_name text,
  customer_rut text,
  customer_email text,
  issue_date date,
  due_date date,
  invoice_currency text default 'CLP',
  invoice_notes text default null,
  invoice_tax_rate numeric default 0.19,
  invoice_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
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
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'No authenticated user found.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'No profile found for current user.';
  end if;

  normalized_rut := upper(regexp_replace(trim(coalesce(customer_rut, '')), '\s+', '', 'g'));

  if jsonb_typeof(invoice_items) <> 'array' or jsonb_array_length(invoice_items) = 0 then
    raise exception 'Invoice items are required.';
  end if;

  select *
  into current_customer
  from public.customers
  where tenant_id = current_profile.tenant_id
    and rut = normalized_rut
    and deleted_at is null
  limit 1;

  if not found then
    insert into public.customers (
      tenant_id,
      name,
      rut,
      email,
      created_by
    )
    values (
      current_profile.tenant_id,
      trim(customer_name),
      normalized_rut,
      nullif(trim(coalesce(customer_email, '')), ''),
      current_user_id
    )
    returning *
    into current_customer;
  end if;

  for item in select * from jsonb_array_elements(invoice_items)
  loop
    qty_value := (item ->> 'qty')::numeric;
    unit_price_value := (item ->> 'unitPrice')::numeric;
    line_total_value := round(qty_value * unit_price_value, 2);
    subtotal_value := subtotal_value + line_total_value;
  end loop;

  subtotal_value := round(subtotal_value, 2);
  tax_value := round(subtotal_value * coalesce(invoice_tax_rate, 0.19), 2);
  total_value := round(subtotal_value + tax_value, 2);
  generated_number := 'FV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.invoices (
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
    created_by
  )
  values (
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
    current_user_id
  )
  returning *
  into created_invoice;

  for item in select * from jsonb_array_elements(invoice_items)
  loop
    qty_value := (item ->> 'qty')::numeric;
    unit_price_value := (item ->> 'unitPrice')::numeric;
    line_total_value := round(qty_value * unit_price_value, 2);
    product_id_value := case
      when nullif(item ->> 'productId', '') is null then null
      else (item ->> 'productId')::uuid
    end;

    insert into public.invoice_items (
      tenant_id,
      invoice_id,
      product_id,
      description,
      qty,
      unit_price,
      line_total
    )
    values (
      current_profile.tenant_id,
      created_invoice.id,
      product_id_value,
      trim(coalesce(item ->> 'description', '')),
      qty_value,
      unit_price_value,
      line_total_value
    );
  end loop;

  return created_invoice.id;
end;
$$;

grant execute on function public.create_draft_invoice_with_customer(text, text, text, date, date, text, text, numeric, jsonb) to authenticated;

create or replace function public.issue_invoice_secure(target_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice public.invoices%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'No authenticated user found.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'No profile found for current user.';
  end if;

  select *
  into target_invoice
  from public.invoices
  where id = target_invoice_id
    and tenant_id = current_profile.tenant_id;

  if not found then
    raise exception 'Invoice not found.';
  end if;

  if target_invoice.status <> 'draft' then
    raise exception 'Only draft invoices can be issued.';
  end if;

  update public.invoices
  set status = 'issued',
      updated_at = now()
  where id = target_invoice.id;

  insert into public.accounts_receivable (
    tenant_id,
    invoice_id,
    balance,
    status,
    due_date
  )
  values (
    current_profile.tenant_id,
    target_invoice.id,
    target_invoice.total,
    'open',
    target_invoice.due_date
  )
  on conflict (invoice_id)
  do update
  set balance = excluded.balance,
      status = excluded.status,
      due_date = excluded.due_date,
      updated_at = now();

  return target_invoice.id;
end;
$$;

grant execute on function public.issue_invoice_secure(uuid) to authenticated;

create or replace function public.register_invoice_payment_secure(
  target_invoice_id uuid,
  payment_amount numeric,
  payment_date_value date,
  payment_reference text default null,
  payment_method_value text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice public.invoices%rowtype;
  target_receivable public.accounts_receivable%rowtype;
  next_balance numeric(14,2);
  next_receivable_status public.receivable_status;
  next_invoice_status public.invoice_status;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'No authenticated user found.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'No profile found for current user.';
  end if;

  select *
  into target_invoice
  from public.invoices
  where id = target_invoice_id
    and tenant_id = current_profile.tenant_id;

  if not found then
    raise exception 'Invoice not found.';
  end if;

  select *
  into target_receivable
  from public.accounts_receivable
  where invoice_id = target_invoice_id
    and tenant_id = current_profile.tenant_id;

  if not found then
    raise exception 'Invoice receivable not found.';
  end if;

  if payment_amount <= 0 then
    raise exception 'Payment amount must be positive.';
  end if;

  if payment_amount > target_receivable.balance then
    raise exception 'Payment cannot exceed outstanding balance.';
  end if;

  insert into public.cash_movements (
    tenant_id,
    source_type,
    source_id,
    kind,
    amount,
    movement_date,
    reference,
    payment_method,
    status,
    created_by
  )
  values (
    current_profile.tenant_id,
    'invoice',
    target_invoice_id,
    'income',
    payment_amount,
    payment_date_value,
    coalesce(nullif(trim(coalesce(payment_reference, '')), ''), 'Pago factura ' || target_invoice.number),
    coalesce(nullif(trim(coalesce(payment_method_value, '')), ''), 'transferencia'),
    'confirmed',
    current_user_id
  );

  next_balance := round(target_receivable.balance - payment_amount, 2);
  next_receivable_status := case when next_balance = 0 then 'settled' else 'partial' end;
  next_invoice_status := case when next_balance = 0 then 'paid' else 'partially_paid' end;

  update public.accounts_receivable
  set balance = next_balance,
      status = next_receivable_status,
      last_payment_at = now(),
      updated_at = now()
  where id = target_receivable.id;

  update public.invoices
  set status = next_invoice_status,
      updated_at = now()
  where id = target_invoice.id;

  return target_invoice.id;
end;
$$;

grant execute on function public.register_invoice_payment_secure(uuid, numeric, date, text, text) to authenticated;

notify pgrst, 'reload schema';
