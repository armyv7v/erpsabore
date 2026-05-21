# Plan de implementación: botones 100% funcionales

## 1) Objetivo

Garantizar que cada botón visible del ERP ejecute su acción esperada, con validación, feedback en español, control de permisos y trazabilidad (logs + pruebas).

## 2) Alcance

- Incluye botones de `src/app/(dashboard)` y componentes reutilizables en `src/components`.
- Incluye acciones de navegación, submit, modales, filtros, exportaciones y acciones sobre datos (crear, emitir, pagar, etc.).
- Excluye cambios de diseño mayores; foco en comportamiento funcional.

## 3) Criterio de botón completado

Un botón se considera cerrado cuando cumple todo lo siguiente:

1. Ejecuta la acción correcta (navega, abre modal o dispara server action).
2. Tiene validación previa cuando corresponde.
3. Muestra estado de carga (`loading`/`disabled`) durante la ejecución.
4. Entrega feedback en español (`success`/`error`) visible para el usuario.
5. Refresca/revalida datos de la vista impactada.
6. Respeta permisos por rol/tenant.
7. Tiene al menos una prueba automatizada E2E del flujo principal.

## 4) Enfoque de implementación

### Fase A - Inventario y clasificación (1-2 días)

- Levantar inventario de botones por ruta y componente.
- Clasificar por tipo: `navegación`, `UI local`, `acción de negocio`, `exportación`.
- Marcar criticidad: `alta`, `media`, `baja`.

### Fase B - Contratos de acción (1-2 días)

Para cada botón definir:

- Precondiciones.
- Acción exacta.
- Mensaje esperado en éxito y error.
- Datos afectados.
- Revalidación requerida (`revalidatePath` / `router.refresh`).

### Fase C - Implementación por módulos (5-10 días)

Orden recomendado:

1. Autenticación + navegación global.
2. Ventas.
3. Facturación.
4. Finanzas (flujo de caja, conciliación, estado de resultados).
5. Módulos secundarios (Inventario, CRM, Proveedores, Despachos, RRHH, Reportes, Usuarios, Sucursales).

### Fase D - QA integral y hardening (2-3 días)

- Pruebas E2E de flujos críticos.
- Pruebas de regresión rápidas por módulo.
- Ajustes de UX: estados disabled, errores claros, confirmaciones.

## 5) Flujo de trabajo por botón

1. Registrar botón en `BUTTONS_AUDIT.md`.
2. Definir contrato funcional.
3. Implementar acción/handler.
4. Agregar mensajes y estados de carga.
5. Crear/actualizar prueba E2E.
6. Validar en staging/prod y marcar como `OK`.

## 6) Priorización inicial (alta)

- `Login`: ingresar y salir.
- `Ventas`: `Nueva Factura`, `Guardar Borrador`, filtros y búsqueda.
- `Facturación`: `Emitir`, `Registrar pago`, `Ver documento`.
- `Flujo de Caja`: botones de `Nuevo Movimiento` y `Descarga`.
- `Conciliación`: `Auto-conciliar`, tabs y sugerencias.

## 7) Métricas de éxito

- 100% de botones inventariados.
- 100% de botones críticos en estado `OK`.
- 0 botones críticos sin handler.
- 0 errores silenciosos en flujos críticos.
- >= 95% de pruebas E2E críticas en verde.

## 8) Riesgos y mitigación

- Riesgo: botones con UI pero sin backend.
  - Mitigación: contrato + stub explícito + ticket obligatorio.
- Riesgo: permisos RLS/tenant bloqueando acciones.
  - Mitigación: prueba E2E con usuario real + verificación de lectura post-escritura.
- Riesgo: acciones "silenciosas" sin feedback.
  - Mitigación: estándar único de mensajes y loading.

## 9) Entregables

- `BUTTONS_AUDIT.md` actualizado por sprint.
- PR por módulo con cambios funcionales + pruebas.
- Checklist de validación productiva por módulo.

## 10) Inicio inmediato

Primera iteración sugerida:

1. Cerrar 100% `Ventas`.
2. Cerrar 100% `Facturación`.
3. Cerrar 100% `Flujo de Caja`.

Luego continuar con `Conciliación` y navegación global.
