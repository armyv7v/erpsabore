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

---

## Sesión: 17 de Junio, 2026

### 1. Vertical de Finanzas e Impuestos
- **Impuestos Chilenos:** Se implementó la calculadora de impuestos nacionales y Previred con alertas de calendario de vencimientos (`d9c114c`).
- **Corrección de Queries:** Se ajustaron las consultas PostgreSQL para filtrar estados financieros usando `confirmed` en lugar de `cancelled` (`503dfdc`).

---

## Sesión: 30 de Junio, 2026

### 1. Optimización e Interactividad en Inventario
- **UI/UX y Modales:** Reemplazo del cuadro de confirmación nativo del navegador por modales web personalizados para eliminar productos, aplicando actualizaciones optimistas de UI (`b8214bc`).
- **Control y Variantes:** Auto-generación de SKU/código de barra, creación de productos y segmentación de guantes y envases por tamaños, solucionando problemas de superposición en el dropdown de stock (`f4d318b`).
- **Filtros Dinámicos:** Las tarjetas resumen del inventario ahora actúan como botones interactivos para filtrar el listado en tiempo real (`b73b1e3`).
- **Correcciones de RLS:** Uso del cliente admin de Supabase para evitar restricciones de la política `SELECT` durante el borrado lógico (`f40c67a`).
- **Imágenes:** Permitido el uso de URLs relativas para imágenes de productos dentro de los esquemas del validador (`1c351e9`).

### 2. Gestión de RRHH y Liquidaciones
- **Liquidaciones de Sueldo:** Conexión a la base de datos real y reseteo de los mockups estáticos de remuneraciones (`dee8ac6`).
- **Navegación:** Botones para volver al Dashboard principal desde el POS (`48f4485`).

### 3. Administración de Usuarios y Seguridad
- **Modales de Usuario:** Activación del menú de tres puntos con modal personalizado para eliminación optimista (`a32d56e`) y modal para edición de datos (`1958b7a`).

### 4. Facturación Electrónica (DTE)
- **Firma DTE:** Integración de un modal personalizado para confirmar la revocación de la firma digital (`86348ad`).

### 5. UI/UX Global
- **Mobile Navigation:** Corrección de la superposición del menú móvil en layouts adaptativos y reemplazo por alturas dinámicas (`dvh`) en modales (`ccef1f4`).

---

## Sesión: 1 de Julio, 2026 (Sesión de Hoy)

### 1. Configuración de Tenant y Datos Regionales
- **Datos Regionales Chilenos:** Integración de la base de datos completa de regiones y comunas de Chile en la vista de configuración de empresa (`aaceccd`).
- **DTE y PDF:** Ajuste dinámico de los encabezados PDF del DTE obtenidos directamente desde la configuración corporativa en base de datos (`d1805d7`).

### 2. Bypass de RLS en Producto
- **Inserciones Seguras:** Uso del cliente administrador de Supabase en `src/app/actions/inventory.ts` para evitar la restricción RLS al insertar/actualizar productos en la base de datos (`6693657`).

### 3. Portal de RRHH y Noticias
- **Portal del Empleado:** Implementación del portal de RRHH interactivo para ver anuncios y solicitar vacaciones, enlazando las colecciones `announcements` y `vacations` (`8221d35`).

### 4. Notificaciones
- **Gestión de Alertas:** Incorporación de botones para borrar de forma masiva notificaciones leídas e individualmente cada alerta (`19d4789`).

### 5. Estado Actual y Trabajo Pendiente (En Progreso)
- **Reportes Analíticos:** Capa de servicios y exportación a PDF/Excel de informes de ventas, inventario y cierres de caja (`src/app/actions/reports.ts` y `src/lib/utils/export-utils.ts` están listos localmente, pendientes de confirmar).
