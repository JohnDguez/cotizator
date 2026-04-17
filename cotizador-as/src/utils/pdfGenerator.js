import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (n) => {
  if (n == null || isNaN(n)) return '$0.00'
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })
}

export function generarPDF(cotizacion) {
  const { cliente, descripcion, tipo_trabajo, items = [], totales = {}, fecha, folio, notas,
    complejidad_tipografica, altura_instalacion, superficie_instalacion } = cotizacion

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210

  // HEADER
  doc.setFillColor(232, 93, 38)
  doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('AS DISEÑO', 14, 13)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Agencia de Publicidad · Culiacán, Sinaloa', 14, 21)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Folio: ${folio || '—'}`, W - 14, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${fecha || '—'}`, W - 14, 20, { align: 'right' })

  // INFO CLIENTE
  let y = 38
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(cliente || 'Sin especificar', 38, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('TRABAJO:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(tipo_trabajo || '—', 38, y)

  if (descripcion) {
    y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPCIÓN:', 14, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(descripcion, W - 50)
    doc.text(lines, 38, y)
    y += (lines.length - 1) * 5
  }

  if (complejidad_tipografica || altura_instalacion || superficie_instalacion) {
    y += 5
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    const meta = [
      complejidad_tipografica && `Complejidad: ${complejidad_tipografica}`,
      altura_instalacion && `Altura: ${altura_instalacion}`,
      superficie_instalacion && `Superficie: ${superficie_instalacion}`,
    ].filter(Boolean).join('   ·   ')
    doc.text(meta, 14, y)
    doc.setTextColor(30, 30, 30)
  }

  y += 7
  doc.setDrawColor(232, 93, 38)
  doc.setLineWidth(0.4)
  doc.line(14, y, W - 14, y)
  y += 5

  // TABLA DE INSUMOS
  autoTable(doc, {
    startY: y,
    head: [['Insumo / Material', 'Proveedor', 'Cant.', 'Unidad', 'C/Unidad', 'Subtotal']],
    body: items.map(i => [
      i.material || '—',
      i.proveedor || '—',
      i.cantidad ?? '—',
      i.unidad || '—',
      fmt(i.costo_unitario),
      fmt(i.subtotal)
    ]),
    headStyles: { fillColor: [232, 93, 38], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 24 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // TOTALES
  let ty = doc.lastAutoTable.finalY + 8
  const col1 = 122
  const col2 = W - 14

  const fila = (label, valor, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(bold ? 30 : 90, bold ? 30 : 90, bold ? 30 : 90)
    doc.setFontSize(8.5)
    doc.text(label, col1, ty)
    doc.text(fmt(valor), col2, ty, { align: 'right' })
    ty += 6
  }

  fila('Total Bruto:', totales.total_bruto)
  fila(`Utilidad (${totales.pct_utilidad ?? 40}%):`, totales.utilidad)
  if (totales.gastos_admin > 0) fila(`Gastos Adm. (${totales.pct_gastos_admin}%):`, totales.gastos_admin)
  if (totales.incentivos > 0) fila(`Incentivos (${totales.pct_incentivos}%):`, totales.incentivos)

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(col1, ty - 2, col2, ty - 2)

  fila('Costo Venta Público:', totales.costo_venta_publico, true)
  fila('IVA (16%):', totales.iva)

  ty += 2
  doc.setFillColor(232, 93, 38)
  doc.roundedRect(col1 - 4, ty - 5, col2 - col1 + 8, 11, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('PRECIO FINAL CON IVA:', col1, ty + 2)
  doc.text(fmt(totales.precio_final_con_iva), col2, ty + 2, { align: 'right' })
  ty += 16

  // NOTAS
  if (notas) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.text('Notas:', 14, ty)
    doc.setFont('helvetica', 'normal')
    const notaLines = doc.splitTextToSize(notas, W - 28)
    doc.text(notaLines, 14, ty + 5)
  }

  // PIE
  doc.setFontSize(7.5)
  doc.setTextColor(170, 170, 170)
  doc.setFont('helvetica', 'normal')
  doc.text('Cotización válida por 15 días hábiles. Precios en MXN sujetos a cambio sin previo aviso.', 14, 287)
  doc.text('Tiempo de entrega a convenir según agenda de producción.', 14, 291.5)

  const nombreCliente = (cliente || 'cliente').replace(/\s+/g, '_').replace(/[^\w]/g, '')
  doc.save(`Cotizacion_${folio}_${nombreCliente}.pdf`)
}
