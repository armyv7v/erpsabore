# Plan Técnico: Propuesta y Arquitectura Inicial del ERP SaaS

Este documento recopila la visión de arquitectura original planteada para el diseño inicial de la plataforma ERP multi-tenant.

## 1. Stack Tecnológico de Referencia

- **Frontend & API:** Next.js (App Router).
- **Lenguaje:** TypeScript.
- **Estilos:** Tailwind CSS + Shadcn/UI (se evolucionó a Tailwind v4 en la implementación real).
- **Base de Datos:** PostgreSQL en Supabase.
- **Autenticación:** Supabase Auth.
- **Despliegue:** Vercel (Hobby Plan).

## 2. Estructura Inicial de Módulos (Estilo Odoo)

1. **Dashboard:** Resumen financiero consolidado y métricas clave de la empresa.
2. **Ventas y Facturación:** Emisión y control de cobros de facturas comerciales.
3. **Inventario:** Control de existencias físicas y bodegas.
4. **CRM:** Registro de clientes, prospectos y contactos comerciales.
5. **Configuración:** Datos legales de la empresa (RUT, Giro comercial, Dirección, etc.).

## 3. Filosofía del Despliegue e Infraestructura
La selección de este stack permite iniciar con **costo de infraestructura $0**, aprovechando los tiers gratuitos de Supabase y Vercel. La arquitectura multi-tenant de base de datos aísla los datos mediante esquemas o identificadores de `tenant_id` resguardados por Row Level Security (RLS) en PostgreSQL.
