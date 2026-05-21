import { test, expect } from '@playwright/test';

test.describe('Flujo de Facturación Electrónica (DTE) y Gestión de Cobros', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ir directo a la página de facturación. Como PLAYWRIGHT_TEST_BYPASS está activo,
    // el middleware y auth-service saltearán la autenticación Supabase real
    // y cargarán el contexto mockeado de Administrador automáticamente.
    await page.goto('/facturacion');
  });

  test('debería renderizar la página de facturación y mostrar las métricas correctas', async ({ page }) => {
    // Validar título principal
    await expect(page.getByRole('heading', { name: 'Facturación ERP' })).toBeVisible();
    
    // Validar tarjetas de métricas
    await expect(page.locator('text=Total Emitido')).toBeVisible();
    await expect(page.locator('text=Saldo Pendiente')).toBeVisible();
    await expect(page.locator('text=Borradores')).toBeVisible();
  });

  test('debería permitir navegar y cargar archivos en la pestaña Configuración DTE Chile', async ({ page }) => {
    // Hacer clic en la pestaña de configuración DTE
    await page.click('text=Configuración DTE Chile (Firma & Folios)');

    // Verificar que se muestren las secciones de Firma y CAF
    await expect(page.locator('text=Certificado Digital (Firma Electrónica)')).toBeVisible();
    await expect(page.locator('text=Folios Autorizados (CAF)')).toBeVisible();

    // Simular carga de archivos
    // 1. Cargar certificado digital mockeado (.pfx)
    const certFile = {
      name: 'firma_mock.pfx',
      mimeType: 'application/x-pkcs12',
      buffer: Buffer.from('mock-certificate'),
    };
    await page.setInputFiles('input[accept=".pfx,.p12"]', certFile);
    await expect(page.locator('text=Firma Digital cargada correctamente')).toBeVisible({ timeout: 5000 });

    // 2. Cargar folios CAF mockeado (.xml)
    const cafFile = {
      name: 'caf_mock.xml',
      mimeType: 'text/xml',
      buffer: Buffer.from('<xml>mock-caf</xml>'),
    };
    await page.setInputFiles('input[accept=".xml"]', cafFile);
    await expect(page.locator('text=¡Archivo CAF cargado con éxito!')).toBeVisible({ timeout: 5000 });
  });

  test('debería emitir un DTE correctamente desde un borrador y cambiar su badge', async ({ page }) => {
    // Asegurar que estamos en el tab de facturas
    await page.click('text=Flujo de Facturación');

    // Ubicar la factura borrador F-9999 (Cliente Borrador E2E)
    const draftInvoiceRow = page.locator('div.p-5', { hasText: 'F-9999' }).first();
    await expect(draftInvoiceRow).toBeVisible();
    
    // Verificar que muestre el badge "Borrador"
    await expect(draftInvoiceRow.getByText('Borrador', { exact: true })).toBeVisible();

    // Hacer clic en "Emitir DTE"
    const emitButton = draftInvoiceRow.locator('button:has-text("Emitir DTE")');
    await emitButton.click();

    // Verificar el cambio de badge transicional a "Aceptado SII"
    await expect(draftInvoiceRow.locator('text=Aceptado SII')).toBeVisible({ timeout: 8000 });

    // Verificar que aparezcan los botones de visualización oficial (PDF y XML)
    await expect(draftInvoiceRow.locator('text=Ver PDF DTE')).toBeVisible();
    await expect(draftInvoiceRow.locator('text=XML DTE')).toBeVisible();

    // Verificar que se muestre la tarjeta de documento generado en el tope
    await expect(page.locator('text=Documento generado')).toBeVisible();
    await expect(page.locator('text=El documento interno fue generado y quedo disponible en el pipeline de facturacion.')).toBeVisible();
  });

  test('debería registrar un pago reactivamente en una factura emitida', async ({ page }) => {
    await page.click('text=Flujo de Facturación');

    // Ubicar la factura emitida F-2305 (Servicios Mineros Atacama - pending)
    const invoiceRow = page.locator('div.p-5', { hasText: 'F-2305' }).first();
    await expect(invoiceRow).toBeVisible();
    
    // Abrir el modal de pagos
    const registerPaymentButton = invoiceRow.locator('button:has-text("Registrar pago")');
    await registerPaymentButton.click();

    // Verificar que se muestre el modal
    await expect(page.locator('h3:has-text("Registrar pago")')).toBeVisible();

    // Completar el formulario del modal
    await page.fill('input[name="amount"]', '890000'); // Monto total
    await page.fill('input[name="reference"]', 'Pago transferencia E2E');
    
    // Enviar el formulario
    await page.click('button[type="submit"]:has-text("Registrar pago")');

    // El modal debería cerrarse y la factura actualizar su estado a "Pagada" de forma reactiva
    await expect(page.locator('h3:has-text("Registrar pago")')).not.toBeVisible();
    await expect(invoiceRow.locator('text=Pagada')).toBeVisible({ timeout: 8000 });
  });

});
