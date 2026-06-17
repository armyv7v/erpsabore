# Histórico y Registro de Sesiones - ERP Sabore

Este documento resguarda las notas operativas, hallazgos técnicos y avances logrados en cada sesión de desarrollo del proyecto.

---

## Sesión: 15 de Marzo, 2026

### 1. Auditoría de Seguridad (Sitio Externo)
- **Objetivo:** Validar la seguridad del portal de Certificación Internacional del MIJP.
- **Hallazgos:**
  - Uso de protocolo inseguro (HTTP) para transmisión de credenciales.
  - Librerías obsoletas (jQuery 1.9.1 de 2013).
  - Falta de cabeceras críticas (CSP, X-Frame-Options).
  - Riesgo crítico de secuestro de sesión y robo de identidad.

### 2. Inicialización y Migración del ERP Sabore
- **Acción:** Extracción de proyecto desde ZIP y subida a GitHub (`armyv7v/erpsabore`).
- **Arquitectura:** Implementación de **Next.js (App Router)** con TypeScript y Tailwind CSS.
- **Estructura:** Configuración de layouts anidados para Autenticación y Dashboard empresarial.

### 3. Módulos Migrados (Stitch a React)
Se convirtieron exitosamente los siguientes prototipos estáticos a componentes modulares:
- **Core:** Login Administrativo, Dashboard Principal (KPIs y Gráficos).
- **Ventas:** Listado de facturas, tarjetas de resumen.
- **Inventario:** Control de stock y lista de productos.
- **Operaciones:** Catálogo Digital, Gestión de Proveedores, Logística y Despachos.
- **Finanzas:** Facturación (DTEs), Flujo de Caja, Conciliación Bancaria, Estado de Resultados (P&L).
- **RRHH:** Directorio de Empleados, Gestión de Nómina, Portal de Auto-consulta del Empleado.
- **Analítica:** Dashboard de Inteligencia de Negocios (BI).

### 4. Interactividad e Implementación de Lógica (Fase 4)
Se transformaron los siguientes módulos de estáticos a **Client Components** con estado real de React:
- **Inventario:** Buscador en tiempo real, filtros por stock y modal de creación de productos.
- **Ventas:** Buscador por RUT/Cliente, filtros por estado de pago y modal de emisión de facturas.
- **Empleados:** Buscador por nombre/cargo, filtros por departamento y modal de contratación.

---

## Sesión: 16 de Marzo, 2026

### 1. Conexión Real con Supabase
- **Acción:** Se configuró `.env` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Validación:** El proyecto local quedó conectado al proyecto Supabase `tpwrvrrvabgmibplkenv`.
- **Estado:** `npm run build` pasa con entorno real cargado.

### 2. Base de Datos y Autenticación
- **Migraciones aplicadas:** Se ejecutó el esquema base ERP para `tenants`, `profiles`, `customers`, `products`, `invoices`, `invoice_items`, `accounts_receivable`, `cash_movements`, `suppliers` y `employees`.
- **Login real:** Se reemplazó el acceso mock por autenticación real con Supabase Auth.
- **Bootstrap inicial:** Se implementó una función SQL segura para crear `tenant + profile` al primer login.
- **Resultado:** Ya es posible iniciar sesión y entrar al dashboard real.

### 3. Vertical Real de Ventas + Facturación
- **Backend:** Se creó capa de servicios, repositorios, validators y actions para flujo real de facturas.
- **Acciones disponibles:** Crear borrador, emitir factura y registrar pago.
- **UI:** `Ventas` crea borradores reales y `Facturación` ya permite emitir y registrar pagos.
- **Métricas:** Dashboard y Finanzas ya no cuentan `draft` como ventas emitidas.

### 4. Seguridad, RLS y RPC
- **Trabajo realizado:** Se agregaron migraciones para políticas RLS y luego varios ajustes por conflictos de inserción y lectura.
- **Cambio de enfoque:** Las escrituras críticas del vertical se movieron a funciones SQL `SECURITY DEFINER` vía `rpc`.
- **Migraciones relevantes agregadas:**
  - `supabase/migrations/20260316_erp_v1_rls.sql`
  - `supabase/migrations/20260316_erp_v1_bootstrap.sql`
  - `supabase/migrations/20260316_erp_v1_bootstrap_fix.sql`
  - `supabase/migrations/20260316_erp_v1_rls_membership_fix.sql`
  - `supabase/migrations/20260316_erp_v1_invoice_rpc.sql`

### 5. UI/UX Corregido en esta Sesión
- **Modales:** Se corrigió el problema de modales fuera de pantalla.
- **Ajuste:** `max-height`, scroll interno y mejor comportamiento en viewports bajos.

### 6. Estado Actual al Cerrar la Sesión
- **Funciona:** Login real, bootstrap de usuario, acceso al dashboard y base ERP montada en Supabase.
- **Falla vigente:** `No se pudo cargar la factura solicitada.`
- **Lectura técnica:** La escritura de la factura probablemente ya ocurre vía `rpc`, pero falla la lectura posterior del registro recién creado.
- **Punto sospechoso principal:** `getInvoiceById` en `src/lib/repositories/invoice-repository.ts`.
- **Hipótesis principal:** Falta estabilizar políticas `SELECT` o joins sujetos a RLS sobre `invoices`, `customers`, `invoice_items` y `accounts_receivable`.
- **Acciones siguientes:**
  1. Validar en Supabase si la factura se está creando aunque falle el readback.
  2. Ajustar políticas `SELECT` y/o la consulta de `getInvoiceById`.
  3. Revalidar flujo completo: `crear borrador -> emitir -> registrar pago -> reflejo en dashboard/finanzas`.
