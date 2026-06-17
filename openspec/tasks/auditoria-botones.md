# Tareas y Auditoría: Estado de Implementación de Botones

Este documento sirve de checklist vivo para controlar y validar la interactividad real de cada botón en ERP Sabore.

## Leyenda de Estado
- `OK`: Totalmente funcional, con revalidación y pruebas passing.
- `PARCIAL`: Registra comportamiento básico pero carece de feedback en español, loading state o pruebas.
- `PENDIENTE`: Componente estático o con handler no implementado.

## Inventario de Botones

### Módulos Críticos

| ID | Ruta / Componente | Botón | Estado | Prioridad | Acción esperada | Próximo paso |
|---|---|---|---|---|---|---|
| BTN-001 | `src/components/auth/LoginForm.tsx` | Ingresar al ERP | OK | Alta | Autenticar y redirigir a inicio | Mantener prueba E2E login |
| BTN-002 | `src/components/layout/Navbar.tsx` | Salir | OK | Alta | Cerrar sesión y volver a login | Agregar prueba E2E logout |
| BTN-003 | `src/components/layout/Navbar.tsx` | Notificaciones (campana) | OK | Media | Abrir panel dinámico con histórico real | Mantener interactividad y estados de lectura |
| BTN-004 | `src/components/erp/SalesWorkspace.tsx` | Nueva Factura | OK | Alta | Abrir modal de borrador | Mantener validación UI |
| BTN-005 | `src/components/erp/SalesWorkspace.tsx` | Guardar Borrador | OK | Alta | Crear factura draft en DB | Validado tras fix de RLS recursivo (PL/pgSQL) |
| BTN-006 | `src/components/erp/SalesWorkspace.tsx` | Cancelar (modal) | OK | Media | Cerrar modal sin guardar | Validar pérdida de cambios esperada |
| BTN-007 | `src/components/erp/SalesWorkspace.tsx` | Limpiar (modal) | OK | Media | Limpiar formulario local | Agregar prueba de limpieza de campos |
| BTN-008 | `src/components/erp/SalesWorkspace.tsx` | Tabs de filtro (Todas/Pagadas/Pendientes/Vencidas) | OK | Alta | Filtrar listado localmente con useMemo | Mantener orden y reactividad de grilla |
| BTN-009 | `src/components/erp/BillingWorkspace.tsx` | Emitir | OK | Alta | Cambiar draft a emitida y actualizar totales | E2E con validación de estado emitida |
| BTN-010 | `src/components/erp/BillingWorkspace.tsx` | Registrar pago | OK | Alta | Registrar movimiento y ajustar saldo/estado | E2E pago parcial y total |
| BTN-011 | `src/components/erp/BillingWorkspace.tsx` | Ver documento | OK | Alta | Abrir detalle documental de factura | Validar en factura pagada y emitida |
| BTN-012 | `src/app/(dashboard)/finanzas/flujo-caja/page.tsx` | Nuevo Movimiento | OK | Alta | Abrir modal/form para ingreso manual | QA E2E de ingreso manual confirmado |
| BTN-013 | `src/app/(dashboard)/finanzas/flujo-caja/page.tsx` | Descargar | OK | Media | Exportar movimientos (CSV/XLSX) | Validar encoding y apertura en Excel |
| BTN-014 | `src/app/(dashboard)/finanzas/conciliacion/page.tsx` | Auto-conciliar | OK | Alta | Ejecutar motor de conciliación | Persistido sobre `cash_movements` (pending -> confirmed) |
| BTN-015 | `src/app/(dashboard)/finanzas/conciliacion/page.tsx` | Tabs Pendientes/Conciliados/Discrepancias | OK | Alta | Filtrar grillas por estado | Agregar prueba E2E de filtros |
| BTN-016 | `src/app/(dashboard)/finanzas/conciliacion/page.tsx` | Sugerencias | OK | Media | Aplicar sugerencia de match | Persistido sobre `cash_movements` con confianza >= 90 |

### Navegación y Shell

| ID | Ruta / Componente | Botón | Estado | Prioridad | Acción esperada | Próximo paso |
|---|---|---|---|---|---|---|
| BTN-017 | `src/components/layout/Navbar.tsx` | Menú móvil | OK | Alta | Abrir sidebar móvil | Agregar E2E en viewport móvil |
| BTN-018 | `src/components/layout/Sidebar.tsx` | Cerrar menú móvil | OK | Media | Cerrar sidebar móvil | Validar accesibilidad de foco |
| BTN-019 | `src/components/layout/Sidebar.tsx` | Links navegación lateral | OK | Alta | Navegar según rol y destacar activo | Validado con usePathname y micro-animaciones premium |
| BTN-020 | `src/components/layout/DashboardShell.tsx` | Overlay cierre sidebar | OK | Media | Cerrar menú al tap fuera | E2E en móvil |

### Módulos con Placeholders Resueltos

| ID | Ruta / Componente | Botón | Estado | Prioridad | Acción esperada | Próximo paso |
|---|---|---|---|---|---|---|
| BTN-021 | `src/app/(dashboard)/reportes/page.tsx` | Exportar | OK | Media | Descargar reporte | Validado con descarga real de CSV |
| BTN-022 | `src/app/(dashboard)/reportes/page.tsx` | Este Mes / Histórico | OK | Media | Cambiar ventana de datos | Recálculo dinámico en base al período y dpto |
| BTN-023 | `src/app/(dashboard)/rrhh/nomina/page.tsx` | Generar Nómina del Mes | OK | Media | Ejecutar cierre de nómina | Cierre por lotes con pipeline y toast interactivo |
| BTN-024 | `src/app/(dashboard)/rrhh/nomina/page.tsx` | Exportar | OK | Baja | Exportar planilla de nómina | Exportación real de planilla en CSV |

## Checklist de Calidad por Botón
Cada vez que se implemente o edite un botón, verificar:
- [x] La acción se ejecuta de forma consistente.
- [x] Posee estado visual `loading` / `disabled` reactivo.
- [x] Feedback mediante toast o modal en español.
- [x] Datos revalidados en UI al instante de mutar.
- [x] Pruebas unitarias o E2E agregadas al flujo.
