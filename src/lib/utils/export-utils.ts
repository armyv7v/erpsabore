/**
 * Utilidades para exportar datos en formatos CSV (.csv) y PDF (.pdf) en el cliente.
 * El PDF usa importaciones dinámicas para mantener el bundle inicial ligero.
 * CSV se genera en puro JS: sin librerías externas (xlsx tiene CVEs sin fix en npm).
 */
import { showToast } from "@/components/ui/toast";

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

const CSV_DELIMITER = ";";

// Excel es-CL requiere BOM para detectar UTF-8 (si no, muestra acentos rotos)
const CSV_BOM = "\uFEFF";

function toCsvValue(value: string): string {
  if (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Construye el contenido CSV (con BOM) a partir de filas ya mapeadas.
 * Exportado para poder testear el escapado sin DOM.
 */
export function buildCsv(rows: string[][]): string {
  return CSV_BOM + rows.map((row) => row.map(toCsvValue).join(CSV_DELIMITER)).join("\r\n");
}

/**
 * Exporta datos tabulares a un archivo CSV compatible con Excel.
 * Reemplaza a exportToExcel (xlsx): prototype pollution/ReDoS sin fix disponible.
 * @param data Array de objetos con los datos de las filas
 * @param headers Mapa de llaves de objeto a etiquetas amigables (ej: { sku: "SKU", name: "Nombre" })
 * @param fileName Nombre del archivo de salida (sin extensión)
 */
export async function exportToCsv(
  data: any[],
  headers: Record<string, string>,
  fileName: string
) {
  try {
    const keys = Object.keys(headers);
    const rows: string[][] = [
      keys.map((key) => headers[key]),
      ...data.map((item) =>
        keys.map((key) => {
          const val = item[key];
          // Formatear tipos de datos específicos igual que el resto de reportes
          if (key.toLowerCase().includes("price") || key.toLowerCase().includes("total") || key.toLowerCase().includes("cash") || key.toLowerCase().includes("debit") || key.toLowerCase().includes("credit") || key.toLowerCase().includes("transfer") || key === "difference" || key === "subtotal" || key === "tax") {
            return formatCurrency(val);
          }
          if (key.toLowerCase().includes("date") || key.toLowerCase().includes("at")) {
            return val ? new Date(val).toLocaleDateString("es-CL") : "-";
          }
          return val === null || val === undefined ? "" : String(val);
        })
      ),
    ];

    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al exportar a CSV:", error);
    showToast("Ocurrió un error al generar el archivo CSV. Por favor reintenta.", "error");
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
    showToast("Ocurrió un error al generar el archivo PDF. Por favor reintenta.", "error");
  }
}
