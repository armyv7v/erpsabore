# Manual de Procesos: Código de Barras en POS e Inventario

Este documento detalla los procedimientos operativos para cajeros y administradores al utilizar lectores ópticos (escáneres) en los módulos de Punto de Venta (POS) y Control de Inventarios del ERP Sabore.

---

## 1. Procedimiento de Venta en el POS (Flujo del Cajero)

El Punto de Venta (POS) está optimizado para permitir un **flujo continuo de venta sin necesidad de usar el mouse o el teclado**. El lector de códigos de barra emula la entrada de un teclado físico a alta velocidad, lo cual es capturado en segundo plano por el sistema.

### Paso a Paso Operativo:
1. **Ingreso al POS**: El cajero debe entrar a la sección **POS** desde el panel lateral del ERP.
2. **Preparación**: Asegurarse de que la pantalla del POS esté cargada y lista para recibir productos. **No es necesario hacer clic en el campo de búsqueda**. El sistema cuenta con un receptor de eventos global que escucha lecturas en cualquier parte de la pantalla.
3. **Escaneo del Producto**:
   - Tomar el artículo físico y apuntar el lector láser hacia el código de barras.
   - Presionar el gatillo. El lector emitirá un pitido de confirmación.
4. **Adición y Sumatoria Automática**:
   - El sistema detectará la velocidad del tipeo, validará que proviene del escáner y buscará el código en la base de datos (dando prioridad al **Código de Barras** exacto y usando el **SKU** como respaldo).
   - El producto se agregará de inmediato al carrito de compras con cantidad `1`.
   - **Para vender varias unidades de un mismo artículo**: Volver a escanear el código de barras físico del producto. Cada escaneo incrementará automáticamente la cantidad en `+1` (ej. `2`, `3`, `4`...) sin necesidad de tocar la pantalla o el teclado.
5. **Cierre de Venta**: 
   - Una vez escaneados todos los productos, el cajero selecciona el cliente, hace clic en el botón de pago, indica el medio de pago del cliente y confirma la transacción.

---

## 2. Procedimiento para Control y Registro de Inventarios (Flujo del Administrador)

El módulo de Inventarios permite enlazar físicamente los códigos de barra a cada producto y realizar auditorías de stock rápidas utilizando el escáner.

### 2.1 Enlazar Código de Barras a un Producto (Creación o Edición)
1. **Acceso**: El administrador ingresa a la sección **Inventario**.
2. **Seleccionar Acción**:
   - **Producto Nuevo**: Hacer clic en el botón **"Nuevo Producto"** en la esquina superior derecha.
   - **Producto Existente**: Localizar el producto en la lista y hacer clic en el botón de **Editar (Lápiz)** en la columna de acciones.
3. **Capturar Código**:
   - En el modal del formulario, hacer clic en el campo de texto **"Código de Barras (Opcional)"** para posicionar el cursor allí.
   - Pasar el escáner láser sobre el código de barras del producto físico.
   - El lector escribirá automáticamente el número capturado en el campo y avanzará al siguiente campo de forma autónoma.
4. **Completar Datos**: Ingresar el stock inicial (o actual), precio de venta, stock mínimo de alerta y descripción.
5. **Guardar**: Hacer clic en **Guardar** para almacenar los cambios en Supabase. A partir de este momento, el producto estará listo para ser escaneado en el POS.

### 2.2 Auditoría y Búsqueda de Stock Rápida
1. **Acceso**: El administrador ingresa al módulo de **Inventario**.
2. **Posicionamiento**: Hacer clic en la barra superior de búsqueda general.
3. **Escaneo**: Pasar el escáner sobre el código de barras del producto físico que se desea auditar en la estantería.
4. **Resultado**: La grilla se filtrará al instante, mostrando únicamente el producto escaneado. Esto permite verificar de forma inmediata si la cantidad física en estante coincide con el stock digital registrado en el ERP, agilizando los inventarios mensuales.
