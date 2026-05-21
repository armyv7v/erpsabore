# Matriz de accesos por rol

Documento operativo para definir qué rutas puede usar cada perfil dentro del ERP.

## Objetivo

Separar claramente los accesos entre administración y operación comercial, evitando que los vendedores entren a módulos que no necesitan para su trabajo diario.

## Roles

- `admin`: acceso total al sistema.
- `ventas`: perfil comercial para venta directa a comercios.
- `finanzas`: control de cobranza, caja, conciliación y resultados.
- `bodega`: inventario, catálogo, despachos y abastecimiento.
- `rrhh`: gestión de personas y nómina.

## Rutas permitidas

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

## Perfil ventas

El rol `ventas` está pensado para vendedores que hacen venta directa a otros comercios.

### Lo que sí pueden hacer

- Crear borradores en `Ventas`.
- Emitir y gestionar facturas en `Facturación`.
- Consultar clientes en `CRM`.
- Revisar productos y precios en `Catálogo`.
- Revisar operaciones relacionadas con `Despachos`.

### Lo que no deberían tocar

- Configuración administrativa.
- Gestión de usuarios y sucursales.
- Flujo de caja, conciliación y estado de resultados.
- Nómina, empleados y módulos internos de RRHH.
- Gestión interna de inventario físico.

## Implementación actual

La política está reflejada en dos capas:

1. `src/lib/navigation.ts`
   Define qué opciones aparecen en navegación lateral y móvil.
2. `src/lib/access-control.ts`
   Define qué rutas están realmente permitidas por rol.

Además, `src/components/layout/DashboardShell.tsx` redirige al usuario a `/` si intenta acceder manualmente a una ruta fuera de su alcance.

## Regla de mantenimiento

Cada vez que se agregue una nueva ruta o módulo:

1. actualizar `src/lib/navigation.ts`
2. actualizar `src/lib/access-control.ts`
3. actualizar este documento

Si no se actualizan las tres capas, tarde o temprano alguien verá algo que no debería o perderá acceso a algo que sí necesita.
