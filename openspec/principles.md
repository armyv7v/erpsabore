# Principios y Estándares del Proyecto - ERP Sabore

Este documento define el stack tecnológico oficial, patrones de diseño y convenciones arquitectónicas obligatorias en el desarrollo de ERP Sabore.

## Stack Tecnológico

- **Frontend & API:** Next.js 16 (App Router) con TypeScript.
- **Estilos:** Tailwind CSS v4 con iconos de Lucide.
- **Base de Datos:** PostgreSQL en Supabase.
- **Pruebas:** Vitest (unidades/servicios) y Playwright (E2E).

## Convenciones de Base de Datos y Seguridad

### 1. Lecturas (Reads)
- Se utiliza el cliente estándar de JS de Supabase (`@supabase/supabase-js`).
- Las consultas están regidas por las políticas RLS (Row Level Security) configuradas directamente en PostgreSQL.

### 2. Escrituras Críticas (Writes)
- Debido a conflictos de RLS recursivo y validaciones complejas de membresía en multi-tenant, las escrituras críticas de negocio (como emisión de facturas o registro de pagos) **deben implementarse a través de funciones RPC (SECURITY DEFINER) en la base de datos**.
- Esto permite omitir temporalmente las restricciones de lectura/escritura de RLS durante la transacción, garantizando la integridad de los datos bajo un contexto seguro.

## Convenciones de UI y Estilo

- **Alineación de Diseño:** Seguir el sistema de diseño basado en Tailwind v4.
- **Aesthetics Premium:**
  - Evitar colores planos sin contraste.
  - Usar micro-animaciones en botones e interactivos para mejorar el feedback visual.
  - Diseñar interfaces con estados de carga claros (skeletons, botones deshabilitados con spinner) para evitar dobles envíos.
