/**
 * Servicio de Impresión Física y Control de Hardware (ESC/POS)
 * Diseñado con soporte nativo para la API Web Serial del navegador.
 */

export interface EscPosItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface EscPosSale {
  folio: string;
  total: number;
  paymentMethod: string;
  change: number;
}

export class PrinterService {
  private static serialPort: any | null = null;

  /**
   * Solicita al usuario vincular una impresora térmica a través del puerto Serial/USB del navegador.
   */
  static async requestConnection(): Promise<boolean> {
    if (typeof window === "undefined" || !("serial" in navigator)) {
      console.warn("[PrinterService] Web Serial API no es soportada por este navegador.");
      return false;
    }

    try {
      // Solicita puerto serial
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.serialPort = port;
      console.log("[PrinterService] Impresora Serial conectada con éxito.");
      return true;
    } catch (err) {
      console.error("[PrinterService] Error al conectar con el puerto serial:", err);
      return false;
    }
  }

  /**
   * Genera el buffer binario de comandos ESC/POS estándar para una impresora térmica de 80mm.
   */
  static compileEscPosReceipt(items: EscPosItem[], sale: EscPosSale, dteType: number): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    // Helpers para empujar comandos
    const pushBytes = (...bytes: number[]) => chunks.push(new Uint8Array(bytes));
    const pushText = (text: string) => chunks.push(encoder.encode(text));

    // 1. Inicializar impresora (ESC @)
    pushBytes(0x1b, 0x40);

    // 2. Alinear al centro (ESC a 1) y Negrita (ESC E 1)
    pushBytes(0x1b, 0x61, 0x01);
    pushBytes(0x1b, 0x45, 0x01);
    
    // Título Doble Alto/Ancho
    pushBytes(0x1b, 0x21, 0x30); // Texto gigante
    pushText("SABORÉ SPA\n");
    pushBytes(0x1b, 0x21, 0x00); // Reset texto
    
    pushText("R.U.T.: 77.947.538-7\n");
    pushText("Av. Providencia 1234, Providencia\n");
    pushText("Santiago - Chile\n");
    pushBytes(0x1b, 0x45, 0x00); // Negrita off
    pushText("--------------------------------\n");

    // 3. Cabecera DTE
    pushBytes(0x1b, 0x45, 0x01);
    pushText(dteType === 33 ? "FACTURA ELECTRONICA\n" : "BOLETA ELECTRONICA\n");
    pushBytes(0x1b, 0x21, 0x10); // Doble altura
    pushText(`FOLIO: ${sale.folio}\n`);
    pushBytes(0x1b, 0x21, 0x00);
    pushBytes(0x1b, 0x45, 0x00);
    pushText("S.I.I. - SANTIAGO ORIENTE\n");
    pushText("--------------------------------\n");

    // 4. Alinear a la izquierda (ESC a 0)
    pushBytes(0x1b, 0x61, 0x00);
    pushText(`Fecha: ${new Date().toLocaleString("es-CL")}\n`);
    pushText("Cajero: Terminal POS #01\n");
    pushText("--------------------------------\n");

    // 5. Lista de productos (80mm soporta 42 o 48 caracteres por línea)
    pushBytes(0x1b, 0x45, 0x01);
    pushText("DESCRIPCION      CANT   P.U   TOTAL\n");
    pushBytes(0x1b, 0x45, 0x00);

    for (const item of items) {
      // Ajustar descripción a 16 caracteres
      const namePart = item.name.substring(0, 15).padEnd(16, " ");
      const qtyPart = String(item.qty).padStart(4, " ");
      const pricePart = `$${item.unitPrice}`.padStart(7, " ");
      const totalPart = `$${item.qty * item.unitPrice}`.padStart(9, " ");
      pushText(`${namePart}${qtyPart}${pricePart}${totalPart}\n`);
    }
    pushText("--------------------------------\n");

    // 6. Alinear a la derecha (ESC a 2)
    pushBytes(0x1b, 0x61, 0x02);
    pushText(`Neto:  $${Math.round(sale.total / 1.19).toLocaleString("es-CL")}\n`);
    pushText(`I.V.A (19%):  $${Math.round(sale.total - sale.total / 1.19).toLocaleString("es-CL")}\n`);
    
    pushBytes(0x1b, 0x45, 0x01);
    pushBytes(0x1b, 0x21, 0x10); // Doble altura
    pushText(`TOTAL:  $${sale.total.toLocaleString("es-CL")}\n`);
    pushBytes(0x1b, 0x21, 0x00);
    pushBytes(0x1b, 0x45, 0x00);
    pushText("--------------------------------\n");

    // 7. Datos de pago
    pushText(`Metodo: ${sale.paymentMethod.toUpperCase()}\n`);
    pushText(`Pagado: $${(sale.total + sale.change).toLocaleString("es-CL")}\n`);
    if (sale.change > 0) {
      pushBytes(0x1b, 0x45, 0x01);
      pushText(`Vuelto: $${sale.change.toLocaleString("es-CL")}\n`);
      pushBytes(0x1b, 0x45, 0x00);
    }

    // 8. Mensaje y corte
    pushBytes(0x1b, 0x61, 0x01); // Centro
    pushText("\n¡Gracias por tu compra!\n");
    pushText("Verifique su DTE en sii.cl\n\n\n\n");

    // Comando de Apertura de Cajón Monedero (ESC p m t1 t2)
    pushBytes(0x1b, 0x70, 0x00, 0x19, 0xfa);

    // Comando de Corte de Papel (GS V m)
    pushBytes(0x1d, 0x56, 0x41, 0x00);

    // Combinar todos los chunks en un único Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Envía los bytes crudos ESC/POS generados a la impresora USB vinculada.
   */
  static async printReceiptDirect(items: EscPosItem[], sale: EscPosSale, dteType: number): Promise<boolean> {
    if (!this.serialPort) {
      const connected = await this.requestConnection();
      if (!connected) return false;
    }

    try {
      const writer = this.serialPort.writable.getWriter();
      const escPosData = this.compileEscPosReceipt(items, sale, dteType);
      await writer.write(escPosData);
      writer.releaseLock();
      console.log("[PrinterService] Impresión directa de ticket térmica completada.");
      return true;
    } catch (err) {
      console.error("[PrinterService] Error al escribir en el puerto serial de la impresora:", err);
      return false;
    }
  }
}
