# Especificación: Matriz de Accesos por Rol

Este documento define la política de seguridad y accesibilidad de rutas según el rol asignado a cada usuario en ERP Sabore.

## Objetivo
Separar claramente los accesos entre administración y operación comercial, evitando que los vendedores entren a módulos que no necesitan para su trabajo diario y protegiendo la información sensible de finanzas y rrhh.

## Definición de Roles

- **`admin`**: Acceso total al sistema y configuraciones globales.
- **`ventas`**: Perfil comercial para venta directa a comercios y clientes.
- **`finanzas`**: Control de cobranza, caja, conciliación y estado de resultados.
- **`bodega`**: Gestión de inventario, catálogo, despachos y abastecimiento.
- **`rrhh`**: Gestión de personas, nómina y fichas de empleados.

## Matriz de Rutas y Permisos

| Ruta | Admin | Ventas | Finanzas | Bodega | RRHH |
|---|---|---|---|---|---|
| `/` | SI | SI | SI | SI | SI |
| `/ventas` | SI | SI | NO | NO | NO |
| `/facturacion` | SI | SI | SI | NO | NO |
| `/crm` | SI | SI | NO | NO | NO |
| `/catalogo` | SI | SI | NO | SI | NO |
| `/despachos` | SI | SI | NO | SI | NO |
| `/inventario` | SI | NO | NO | SI | NO |
| `/proveedores` | SI | NO | SI | SI | NO |
| `/finanzas/flujo-caja` | SI | NO | SI | NO | NO |
| `/finanzas/conciliacion` | SI | NO | SI | NO | NO |
| `/finanzas/estado-resultados` | SI | NO | SI | NO | NO |
| `/empleados` | SI | NO | NO | NO | SI |
| `/rrhh/nomina` | SI | NO | SI | NO | SI |
| `/rrhh/portal` | SI | NO | NO | NO | SI |
| `/reportes` | SI | NO | SI | NO | SI |
| `/sucursales` | SI | NO | NO | NO | NO |
| `/usuarios` | SI | NO | NO | NO | NO |

## Flujo de Implementación Técnica

La política está reflejada en tres capas de control:
1. **Navegación Dinámica (`src/lib/navigation.ts`)**: Define qué opciones se renderizan en el panel lateral y móvil para cada rol.
2. **Control de Acceso de Rutas (`src/lib/access-control.ts`)**: Valida que la ruta solicitada por el cliente esté en el array permitido para su rol.
3. **Capa Shell (`src/components/layout/DashboardShell.tsx`)**: Maneja el middleware visual redirigiendo a `/` si se detecta un intento de entrada manual a una ruta restringida.

## Regla de Mantenimiento (SDD)
Cualquier nueva ruta o cambio de módulo requiere actualizar de forma atómica:
1. `src/lib/navigation.ts`
2. `src/lib/access-control.ts`
3. Este documento de especificación.
