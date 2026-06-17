# Desarrollo Guiado por Especificaciones (SDD) - ERP Sabore

Este directorio `openspec/` contiene las especificaciones vivas, principios arquitectónicos y planes de implementación del proyecto, inspirados en el estándar **GitHub Spec Kit**.

El objetivo es mantener una única fuente de verdad y evitar la improvisación ("vibe coding"). Al estructurar las especificaciones antes de codificar, garantizamos que tanto humanos como agentes de IA trabajen con el contexto correcto.

## Estructura del Directorio

- [principles.md](file:///c:/Users/EnderJavier/Documents/Proyectos%20WEB/erpsabore/openspec/principles.md): Estándares del stack, patrones de diseño y convenciones del proyecto que no cambian entre features.
- **`specs/`**: Requerimientos funcionales detallando el *qué* y el *por qué* desde la perspectiva del usuario y del negocio.
- **`plans/`**: Diseños técnicos y blueprints de arquitectura que describen el *cómo*.
- **`tasks/`**: Checklists de tareas detalladas y auditorías de implementación.
- **`history/`**: Registro de sesiones anteriores y decisiones de diseño históricas.

## Flujo de Trabajo (SDD Lifecycle)

1. **Definir la Spec**: Crear un archivo en `specs/` describiendo la funcionalidad, casos de uso y reglas de negocio.
2. **Diseñar el Plan**: Crear un documento en `plans/` con los cambios técnicos (tablas de DB, RLS, middleware, componentes).
3. **Desglosar en Tareas**: Generar una lista en `tasks/` con los criterios de aceptación del código y de las pruebas.
4. **Implementar y Verificar**: Picar código guiándose por el plan y correr la suite de pruebas (Vitest/Playwright).
