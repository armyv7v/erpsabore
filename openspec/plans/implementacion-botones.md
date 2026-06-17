# Plan Técnico: Botones 100% Funcionales

Este plan establece los requisitos y pasos técnicos para asegurar que cada interactivo visual del sistema cuente con comportamiento, validaciones y feedback completos.

## 1. Criterio de Aceptación (Definition of Done)
Un botón u operando interactivo en el ERP se considera cerrado únicamente cuando cumple con:
1. **Acción funcional**: Ejecuta la lógica correcta (navega, abre modal o despacha un server action).
2. **Validaciones**: Bloquea acciones ilógicas o incompletas en el frontend antes de enviar datos al servidor.
3. **Estado de Carga (UX)**: Muestra estados visuales de `loading` / `disabled` para evitar envíos duplicados.
4. **Feedback de Usuario**: Notifica al cliente de forma clara (usando Toasts) en español ante éxitos o errores.
5. **Revalidación de Datos**: Fuerza la actualización de la vista afectada (`router.refresh` o revalidatePath) tras mutaciones.
6. **Seguridad y Permisos**: Restringe la acción según el rol del usuario autenticado.
7. **Pruebas Automatizadas**: Cuenta con un flujo de prueba E2E (Playwright) o unitario (Vitest) pasando.

## 2. Estrategia por Módulos
1. **Autenticación y Shell**: Login de usuario, logout seguro y navegación lateral reactiva al rol.
2. **Ventas**: Flujo de creación de borradores de facturas en DB.
3. **Facturación**: Emisión de facturas (cambio a emitida) y registro de cobros/pagos.
4. **Finanzas**: Creación de movimientos de caja y motor de auto-conciliación bancaria.
5. **Módulos Complementarios**: CRUDs y reportes secundarios de inventario, CRM, RRHH y sucursales.

## 3. Riesgos Técnicos y Mitigaciones
- **Placeholders Visuales**: Elementos de UI sin lógica de backend.
  *Mitigación*: Se crean mocks o stubs explícitos con mensajes de "no disponible" antes de codificar la lógica real.
- **Políticas RLS de Supabase**: Restricciones de base de datos que bloquean escrituras legítimas.
  *Mitigación*: Utilizar funciones RPC con `SECURITY DEFINER` para escrituras críticas de negocio para evadir ciclos infinitos en RLS complejos de membresía.
- **Acciones Silenciosas**: Operaciones de base de datos exitosas pero sin cambio visible en la UI.
  *Mitigación*: Obligatoriedad de implementar el hook de notificación para cada llamada de server action.
