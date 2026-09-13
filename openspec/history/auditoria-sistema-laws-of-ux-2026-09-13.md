# Auditoría del Sistema + Laws of UX — ERP Sabore (2026-09-13)

> **Estado de ejecución (2026-09-13):** los 6 PRs del plan fueron implementados y mergeados el mismo día:
> PR-A seguridad [#7], PR-B dependencias [#9], PR-C botones muertos [#11], PR-D targets 44px [#13],
> PR-E feedback/Escape/escapeHtml [#15], PR-F higiene [#17]. Suite final: 117/117 tests, npm audit 0 vulnerabilidades.
> Deuda pendiente documentada en issues #10 (POD, foto empleado, inventario por sucursal) y #16 (console.*/any, CSP enforce).

---

# Auditoría del Sistema + Laws of UX — ERP Sabore

**Fecha:** 2026-09-13 · **Rama:** `test/ux-pr5-fase5-coverage` · **Alcance:** proyecto completo (164 archivos TS/TSX, ~34.500 líneas)

**Método:** barrido automatizado (npm audit, ESLint, vitest) + dos exploraciones exhaustivas (seguridad/calidad y UX) + verificación manual en primera persona de los hallazgos críticos/altos. Todo hallazgo citado tiene archivo:línea confirmado.

---

## Resumen ejecutivo

| Área | Veredicto | Hallazgos |
|---|---|---|
| Seguridad | 🔴 Requiere acción inmediata | 1 crítica, 3 altas, 5 medias |
| Dependencias | 🔴 19 vulnerabilidades (1 crítica, 12 high) | `xlsx` sin fix disponible |
| Calidad de código | 🟡 Deuda controlada | 108 errores ESLint (mayormente `any`), 73 `console.*`, 14 `alert/confirm` |
| Laws of UX | 🟡 La base está bien, falla el detalle | 61 hallazgos: 11 altos, 31 medios, 19 bajos |
| Tests | 🟢 62/62 pasan | (errores de worker vistos en run concurrente, no reproducibles en aislado) |
| Arquitectura auth/RLS | 🟢 Sólida | RLS en 20 tablas, actions con guards, middleware correcto |

**Lo que hay que arreglar esta semana:** la clave de cifrado de fallback hardcodeada, el bypass de Playwright sin guarda de producción, el borrado cross-tenant de usuarios, y los botones muertos de Despachos/Empleados.

---

## PARTE 1 — Auditoría del sistema (seguridad y calidad)

### 🔴 Críticos

**S1. Clave AES de fallback hardcodeada para certificados SII** — `src/lib/services/crypto-service.ts:10-13`
Si falta `SII_CERT_ENCRYPTION_KEY`, el servicio cifra las claves privadas de los certificados digitales con una clave derivada del literal `"SABORE_LOCAL_DEV_SECRET_KEY_FALLBACK_2026"` — visible en el repositorio. Cualquiera con acceso al código podría descifrar claves privadas SII almacenadas.
**Fix:** fallar duro (throw) si la env no existe; opcionalmente migrar certificados cifrados con la clave vieja.

**S2. `xlsx` con prototype pollution y ReDoS, sin fix disponible** — `npm audit` (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) · uso real en `src/lib/utils/export-utils.ts:47` (`await import("xlsx")` en el cliente).
La vulnerabilidad viaja al bundle del navegador. SheetJS ya no publica fixes en npm.
**Fix:** reemplazar por `exceljs`, o generar CSV plano (no requiere librería), o instalar SheetJS desde su CDN oficial con la versión parchada.

### 🟠 Altas

**S3. Bypass total de auth para E2E sin guarda de producción** — `src/lib/services/auth-service.ts:19-31`, también `src/lib/supabase/config.ts:16` y `src/lib/services/invoice-service.ts:149,189,209`
`PLAYWRIGHT_TEST_BYPASS === "true"` devuelve un usuario admin mock con `supabase: {} as any`. No hay chequeo de `NODE_ENV !== "production"`: si esa variable llega al entorno productivo, auth y roles quedan inoperantes.
**Fix:** añadir `&& process.env.NODE_ENV !== "production"` en las 6 condiciones (o mejor: centralizar en un solo helper).

**S4. Borrado cross-tenant de usuarios** — `src/app/actions/users.ts:141-175`
`deleteManagedUserAction` valida rol admin y evita auto-borrado, pero NO verifica que `userId` pertenezca a `user.tenantId` antes de `auth.admin.deleteUser(userId)` con service role. Un admin puede borrar usuarios de otro tenant pasando un id.
**Fix:** leer el profile del target con el client autenticado del admin, verificar `tenantId`, recién ahí borrar.

**S5. Sin headers de seguridad** — `next.config.ts` (archivo completo, 9 líneas)
No hay CSP, HSTS, X-Frame-Options, X-Content-Type-Options ni Referrer-Policy. En Vercel los defaults cubren parte, pero CSP y XFO no vienen por defecto.
**Fix:** bloque `headers()` en `next.config.ts` (CSP al menos en modo report-only para arrancar).

### 🟡 Medios

**S6. XSS almacenado en ventanas de impresión vía `document.write`** — `src/components/erp/PosWorkspace.tsx:227` (interpolación de `s.customerName`, `folio`, `paymentMethod`) y `src/app/(dashboard)/finanzas/flujo-caja/movements-client.tsx:218` (`m.reference`, etc.)
Los campos vienen de la BD con input de usuario y se interpolan en HTML sin escapar. Un `customerName` tipo `<img src=x onerror=...>` ejecuta JS en el dominio.
**Fix:** escapar con helper (`escapeHtml`) o construir los nodos con `createElement`/`textContent`.

**S7. Subida de certificado digital sin validación de rol** — `src/app/actions/dte.ts:17-19`
`uploadDigitalCertificateAction` valida sesión pero no rol: cualquier usuario autenticado (incluido rol `cliente`) puede subir/reemplazar el certificado digital del tenant.
**Fix:** `assertUserHasRole(user, ["admin"])`.

**S8. Firmador DTE con fallback a clave mock en ruta productiva** — `src/lib/dte/local-dte-adapter.ts:4,106-107,138`
Si no hay certificado cargado, los DTE se "firman" con una clave RSA generada en runtime (`mock-cert.ts`) y solo se avisa por `console.log`. Combinado con `BillingWorkspace.tsx:505` (alert que muestra "XML DTE Oficial" con firma mock), hay riesgo real de emitir documentos tributarios inválidos creyendo que son válidos.
**Fix:** bloquear la emisión (estado de error visible en UI) cuando no exista certificado real; eliminar el alert mock.

**S9. Inconsistencia entre foco de venta y almacén sin filtrar** — ver J9/J10 en parte UX (funcional, no solo visual).

### ⚪ Bajos / deuda

- **73 sentencias `console.*` en 31 archivos** (sin contar tests). Una con PII: `local-dte-adapter.ts:130` loguea `rutFirmante`. Recomendación: utilidad de logging con nivel + limpiar en build de prod.
- **14 `alert()/confirm()/window.prompt` nativos** en 7 archivos: `settings-client.tsx:46`, `inventory-client.tsx:1276`, `bi-client.tsx:80,87,181`, `hr-portal-client.tsx:215,219,228,232,510`, `BillingWorkspace.tsx:505`, `UsersManagementWorkspace.tsx:485`, `export-utils.ts:89,233`.
- **~86 usos de `any`** → 108 errores ESLint, 60 warnings (verificado corriendo `npm run lint`). Archivos más afectados: `vacation-repository.ts` (4), `export-utils.ts` (7), `types/erp.ts:241`, `auth-service.ts:29`.
- **Código muerto:** `src/lib/supabase/token-client.ts` sin usos; variable `supabaseCookieNames` sin uso en `src/lib/supabase/middleware.ts:13`; `userError` sin uso en `auth-service.ts:40`.
- **PII en repo:** `mockSignerInfo` en `src/lib/dte/mock-cert.ts:39-45` contiene RUT y nombre de persona real (no es secreto criptográfico, pero no debería estar).

### ✅ Lo que está BIEN (verificado, sin falsos positivos)

- **Envs fuera de git**: `.gitignore` cubre `.env*`; `git ls-files` no muestra ninguno. Ningún secreto hardcodeado en `src/` (los PEM en `crypto-service.test.ts` son test-only).
- **RLS habilitado en las 20 tablas** (verificado en migraciones), incluida la corrección previa de escalada de privilegios en `profiles` (`20260520_erp_v1_security_fixes.sql`).
- **Server actions con guards**: 59 usos de `requireAuthenticatedContext`/`assertUserHasRole` en 16 archivos; ninguno confía en `tenantId`/`role` del cliente; `registerClientAction` fuerza `role: "cliente"` server-side (`actions/auth.ts:56`).
- **Middleware correcto**: usa `getUser()` (no `getSession`), bloquea usuarios `inactive`, aplica `canAccessPath` por rol; matcher excluye assets correctamente.
- **Supabase**: service role solo server-side, ninguna env `NEXT_PUBLIC_*` sensitiva; client anon con cookies SSR.
- **Sin** `eval`, `innerHTML` directo, ni `http://` de red; 3 `target="_blank"` todos con `noopener noreferrer`; 0 IDs duplicados.

---

## PARTE 2 — Auditoría Laws of UX

**Contexto:** los PRs 1-5 anteriores dejaron una base sólida (login, recovery, navegación seccionada, targets en auth/sidebar, éxito de POS/catálogo). Los 61 hallazgos actuales son el "detalle fino" que quedó afuera.

### Conteo por ley

| Ley | Altos | Medios | Bajos |
|---|---|---|---|
| Fitts (targets) | 3 | 18 | 9 |
| Jakob (convenciones/affordances) | 6 | 4 | 1 |
| Peak-End (cierre de experiencias) | 1 | 3 | 1 |
| Hick/Miller (decisiones) | 1 | 1 | 1 |
| Postel/Tesler (input) | 0 | 2 | 2 |
| Aesthetic-Usability | 0 | 1 | 2 |
| Grouping | 0 | 1 | 1 |
| Doherty (feedback <400ms) | 0 | 1 | 1 |
| Goal-Gradient/Zeigarnik | 0 | 0 | 1 |
| Von Restorff | 0 | 0 | 0 ✅ |

### Top 10 priorizado

1. **Jakob — Botones muertos en Despachos** (alta): "Filtros" y "Fecha" sin `onClick` (`shipments-client.tsx:188-195`), y "POD" —el hito final del flujo de entrega— también muerto (`:344-347`). El usuario ve controles que no hacen nada.
2. **Jakob — Menú fantasma en Empleados** (alta): `MoreVertical` en cada tarjeta sin handler (`employees-client.tsx:183-185`) y círculo "Foto" con `cursor-pointer` pero sin input file (`:226-229`).
3. **Jakob — Filtro "Almacén" que no filtra** (alta): el dropdown actualiza `activeBranch` pero `filteredProducts` nunca lo consulta (`PosWorkspace.tsx:1036-1074` + `:719-758`; mismo bug con mock en `catalog-client.tsx:748-786`). Peor que un botón muerto: tiene estado.
4. **Hick — 4 acciones por fila en CRM** (alta): "Editar", "Convertir a cliente", "Crear cotización", "Guardar cotización" — dos etiquetas casi idénticas con comportamientos distintos (`CRMWorkspace.tsx:421-451`).
5. **Fitts — Steppers de cantidad de 14-22px en POS** (alta): la operación más frecuente del ERP tiene los targets más chicos (`PosWorkspace.tsx:1183-1213`, `1448-1467`).
6. **Peak-End — `alert()` nativo mostrando XML DTE** (alta): `BillingWorkspace.tsx:505` usa alert para "mostrar" el documento tributario, con firma mock y TODO interno visible.
7. **Doherty — "Confirmar Pago y Emitir DTE" sin disabled** (media→riesgo negocio): `PosWorkspace.tsx:1933-1940` permite doble click y emitir DTE duplicado (el overlay de cobertura existe pero no cubre el click inicial).
8. **Peak-End — Alta de producto sin feedback de éxito** (media): `inventory-client.tsx:138-142` cierra el modal en éxito sin mensaje; y error de rollback cae a `alert()` nativo (`:1276`).
9. **Postel — RUT sin autoformato en todos los flujos** (media): placeholder exige "12.345.678-K" pero no hay máscara (`PosWorkspace.tsx:1643-1649`, `RegisterForm.tsx:86-92`, `catalog-client.tsx:1298-1305`).
10. **Jakob — 14+ modales sin cierre con Escape** (media): grep global — solo `ImageZoomLightbox.tsx:13-27` lo implementa. Ese archivo es el patrón a replicar.

### Otros hallazgos notables (medios)

- **Fitts en paginaciones**: 32-36px en `BillingWorkspace.tsx:600`, `inventory-client.tsx:736-787`, `catalog-client.tsx:1007-1058`, `movements-client.tsx:579-597` — un fix único con clase compartida cubre los 4.
- **Fitts en acciones de fila**: `inventory-client.tsx:621-643` (~32px), `CRMWorkspace.tsx:423-450` (~24px), iconos de despachos `:359-374` (~28px).
- **Fitts en POS secundario**: sugerencias de billetes `:1834`, montos rápidos `:1997-2008`, X de 4 modales `:1567/1958/2058/2216`, tirador de sidebar `DashboardShell.tsx:50-58`, papelera de notificaciones `Navbar.tsx:223-233`.
- **Hick**: hasta 6 botones por fila de factura (`BillingWorkspace.tsx:448-555`).
- **Tesler**: "Convertir a cliente" pide reingresar RUT/email cuando la oportunidad ya tiene `customerId` vinculado (`CRMWorkspace.tsx:372-389`).
- **Grouping**: formularios CRM sin `<label>` (placeholder como etiqueta) y planos sin agrupación (`CRMWorkspace.tsx:277-385`); despachos igual (`shipments-client.tsx:409-500`).
- **Aesthetic**: 0 `focus-visible` en POS/Billing/CRM/inventario/catálogo/MobileNav (solo `Sidebar.tsx:44`); hex hardcodeados en catálogo (`catalog-client.tsx:634,1558`); paleta ad-hoc en confirmaciones POS (`:1936,2037,2173`).
- **Zeigarnik**: carrito POS solo en memoria (`PosWorkspace.tsx:63`) — el catálogo sí persiste en localStorage; una venta a medio cargar se pierde al recargar.
- **Doherty menor**: shell de redirección sin spinner (`DashboardShell.tsx:30-33`).

### ✅ Lo que está BIEN (trabajo de los PRs previos, verificado)

- **Auth completo**: loading + disabled + 44px + focus-visible + recuperación en los 4 formularios.
- **Von Restorff**: cero violaciones — ninguna vista tiene 2+ botones primarios compitiendo.
- **Navegación**: 5 secciones con ≤7 ítems cada una (Miller), 5 ítems en móvil (Serial Position correcto).
- **Doherty general**: casi todos los submits del ERP tienen pending+disabled+spinner.
- **Peak-End en POS/catálogo**: éxito con folio/ID y confirmación rica.
- **Goal-Gradient**: carrito catálogo persiste, handoff CRM→Ventas, contadores en vivo.
- **Modales de confirmación custom** en Billing e inventario reemplazando `confirm()` nativo.

---

## Plan de acción sugerido (PRs)

| PR | Contenido | Esfuerzo |
|---|---|---|
| **PR-A (hotfix seguridad)** | S1 (throw sin env) + S3 (guarda NODE_ENV en bypass) + S4 (verificar tenant antes de deleteUser) + S7 (rol en upload certificado) | ~1h |
| **PR-B (dependencias)** | S2: reemplazar `xlsx` por CSV nativo o `exceljs`; `npm audit fix` para ws/vite (dev) | ~2h |
| **PR-C (botones muertos)** | J3-J6, J8-J10: decidir y cablear o eliminar "Filtros"/"Fecha"/"POD"/MoreVertical/Foto/filtro Almacén; D1 disabled en Confirmar Pago | ~3-4h |
| **PR-D (Fitts POS)** | Steppers 1183-1213/1448-1467 a 44px, sugerencias de billetes, montos rápidos, X de modales; clase compartida para paginaciones | ~3h |
| **PR-E (feedback/cierre)** | S6 escapeHtml en impresiones, E3 éxito en alta de producto, migrar 14 alert/confirm a modal/toast, Escape en modales (patrón ImageZoomLightbox) | ~4h |
| **PR-F (higiene)** | Headers de seguridad en next.config, máscara RUT, labels CRM, focus-visible global, limpiar console/any/token-client | ~4-6h |
