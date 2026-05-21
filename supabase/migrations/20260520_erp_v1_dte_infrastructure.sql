-- =============================================================================
-- Migración SQL: Infraestructura DTE Chile
-- 2026-05-20
--
-- Agrega columnas de estado tributario a `invoices` y crea tablas de soporte
-- para folios (CAF) y certificados digitales (firmas).
-- =============================================================================

-- 1. Añadir columnas a invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS dte_type integer DEFAULT 33 NOT NULL,
  ADD COLUMN IF NOT EXISTS dte_status text DEFAULT 'none' NOT NULL,
  ADD COLUMN IF NOT EXISTS dte_xml_url text,
  ADD COLUMN IF NOT EXISTS dte_pdf_url text,
  ADD COLUMN IF NOT EXISTS dte_sii_message text,
  ADD COLUMN IF NOT EXISTS sii_track_id text;

-- Agregar restricción de estado DTE a invoices si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_dte_status' AND conrelid = 'public.invoices'::regclass
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT chk_dte_status CHECK (dte_status IN ('none', 'pending', 'accepted', 'rejected', 'failed'));
  END IF;
END $$;

-- 2. Crear tabla de Folios CAF
CREATE TABLE IF NOT EXISTS public.tenant_cafs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  dte_type integer NOT NULL DEFAULT 33,
  start_folio integer NOT NULL,
  end_folio integer NOT NULL,
  last_used_folio integer NOT NULL,
  caf_xml_content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_folio_range CHECK (start_folio <= end_folio AND last_used_folio >= start_folio - 1 AND last_used_folio <= end_folio),
  CONSTRAINT uq_tenant_dte_range UNIQUE (tenant_id, dte_type, start_folio, end_folio)
);

-- 3. Crear tabla de Certificados Digitales (Firma Electrónica)
CREATE TABLE IF NOT EXISTS public.tenant_digital_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  rut_firmante text NOT NULL,
  subject_name text NOT NULL,
  valid_until timestamptz NOT NULL,
  certificate_data text NOT NULL, -- Almacena el Base64 cifrado
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenant_certificate UNIQUE (tenant_id, rut_firmante)
);

-- 4. RLS y Permisos

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.tenant_cafs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_digital_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para tenant_cafs
DROP POLICY IF EXISTS "tenant_cafs_select" ON public.tenant_cafs;
CREATE POLICY "tenant_cafs_select"
  ON public.tenant_cafs FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "tenant_cafs_write" ON public.tenant_cafs;
CREATE POLICY "tenant_cafs_write"
  ON public.tenant_cafs FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND tenant_id = public.current_tenant_id()
    )
  );

-- Políticas para tenant_digital_certificates (Solo accesible por admins)
DROP POLICY IF EXISTS "tenant_certs_all_admin" ON public.tenant_digital_certificates;
CREATE POLICY "tenant_certs_all_admin"
  ON public.tenant_digital_certificates FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND tenant_id = public.current_tenant_id()
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND tenant_id = public.current_tenant_id()
    )
  );

-- Asignar Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_cafs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_digital_certificates TO authenticated;

-- Notificar recarga de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
