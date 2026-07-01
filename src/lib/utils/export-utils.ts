/**
 * Utilidades para exportar datos en formatos Excel (.xlsx) y PDF (.pdf) en el cliente.
 * Se utilizan importaciones dinámicas para mantener el bundle inicial ligero.
 */

// Helper para formatear monedas chilenas (CLP)
function formatCurrency(val: any): string {
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `$${num.toLocaleString("es-CL")}`;
}

// Helper para formatear fechas
function formatDate(val: any): string {
  if (!val) return "-";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return String(val);
    // Ajustar zona horaria si es necesario, o mostrar formateado
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return String(val);
  }
}

/**
 * Exporta datos tabulares a un archivo Excel (.xlsx).
 * @param data Array de objetos con los datos de las filas
 * @param headers Mapa de llaves de objeto a etiquetas amigables (ej: { sku: "SKU", name: "Nombre" })
 * @param fileName Nombre del archivo de salida (sin extensión)
 * @param sheetName Nombre de la pestaña de la hoja
 */
export async function exportToExcel(
  data: any[],
  headers: Record<string, string>,
  fileName: string,
  sheetName: string = "Reporte"
) {
  try {
    // Importación dinámica de SheetJS
    const XLSX = await import("xlsx");

    // Mapear los datos al formato de los encabezados amigables
    const keys = Object.keys(headers);
    const mappedData = data.map((item) => {
      const row: Record<string, any> = {};
      keys.forEach((key) => {
        const val = item[key];
        // Formatear tipos de datos específicos para Excel
        if (key.toLowerCase().includes("price") || key.toLowerCase().includes("total") || key.toLowerCase().includes("cash") || key.toLowerCase().includes("debit") || key.toLowerCase().includes("credit") || key.toLowerCase().includes("transfer") || key === "difference" || key === "subtotal" || key === "tax") {
          row[headers[key]] = Number(val) || 0;
        } else if (key.toLowerCase().includes("date") || key.toLowerCase().includes("at")) {
          row[headers[key]] = val ? new Date(val).toLocaleDateString("es-CL") : "-";
        } else {
          row[headers[key]] = val === null || val === undefined ? "" : val;
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    
    // Auto-ajustar el ancho de las columnas
    const maxLens = keys.map((key) => {
      const label = headers[key];
      let maxLen = label.length;
      data.forEach((item) => {
        const val = item[key];
        const strVal = val === null || val === undefined ? "" : String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
    worksheet["!cols"] = maxLens;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    alert("Ocurrió un error al generar el archivo Excel. Por favor reintenta.");
  }
}

/**
 * Exporta datos tabulares a un archivo PDF estructurado con formato premium.
 * @param title Título principal del reporte
 * @param headers Array de nombres de columnas
 * @param rows Array bidimensional de strings/valores correspondientes a las filas
 * @param fileName Nombre del archivo de salida (sin extensión)
 * @param subtitle Subtítulo descriptivo opcional
 */
export async function exportToPdf(
  title: string,
  headers: string[],
  rows: any[][],
  fileName: string,
  subtitle?: string
) {
  try {
    // Importación dinámica de jsPDF y jsPDF-AutoTable
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Colores de la paleta (ERP Sabore: Slate / Naranja / Gris)
    const primaryColor = [236, 91, 19]; // Orange #ec5b13
    const secondaryColor = [30, 41, 59]; // Slate-800 #1e293b
    const lightGray = [248, 250, 252]; // Slate-50 #f8fafc

    // 1. Encabezado Corporativo
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, 210, 32, "F");

    // Texto de la marca
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ERP SABORE", 15, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("Sistema de Gestión Integrado", 15, 24);

    // Metadata del Reporte (Derecha)
    const today = new Date().toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.setFontSize(9);
    doc.text(`Fecha Emisión: ${today}`, 130, 15);
    doc.text("Estado: Oficial", 130, 20);

    // Línea divisoria naranja
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 32, 210, 2, "F");

    // 2. Título del Reporte y Subtítulo
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), 15, 45);

    if (subtitle) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 15, 51);
    }

    // 3. Tabla de datos
    autoTable(doc, {
      startY: subtitle ? 56 : 50,
      head: [headers],
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: secondaryColor as any,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: lightGray as any,
      },
      columnStyles: {
        // Alinear a la derecha las columnas numéricas típicas
        // (por ejemplo, si el texto del header contiene palabras clave)
        ...headers.reduce<Record<number, any>>((acc, header, index) => {
          const lowerHeader = header.toLowerCase();
          if (
            lowerHeader.includes("total") ||
            lowerHeader.includes("precio") ||
            lowerHeader.includes("monto") ||
            lowerHeader.includes("cantidad") ||
            lowerHeader.includes("stock") ||
            lowerHeader.includes("costo") ||
            lowerHeader.includes("efectivo") ||
            lowerHeader.includes("diferencia") ||
            lowerHeader.includes("valor")
          ) {
            acc[index] = { halign: "right" };
          } else {
            acc[index] = { halign: "left" };
          }
          return acc;
        }, {}),
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Pie de página en cada página
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        
        // Texto Izquierda
        doc.text("ERP Sabore - Reportes de Control Interno", 15, pageHeight - 10);
        
        // Texto Derecha (Páginas)
        const str = `Página ${data.pageNumber}`;
        doc.text(str, pageSize.width - 25, pageHeight - 10);
      },
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    alert("Ocurrió un error al generar el archivo PDF. Por favor reintenta.");
  }
}
