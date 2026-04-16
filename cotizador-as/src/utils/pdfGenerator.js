import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generarPDF(cotizacion) {
  const doc = new jsPDF()
  const { cliente, descripcion, tipo_trabajo, items, totales, fecha, folio } = cotizacion

  // Header
  doc.setFillColor(232, 93, 38)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('AS DISEÑO', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Agencia de Publicidad · Culiacán, Sinaloa', 14, 19)
  doc.text(`Folio: ${folio}`, 150, 12)
  doc.text(`Fecha: ${fecha}`, 150, 19)

  // Cliente info
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.text(cliente || 'Sin nombre', 40, 38)

  doc.setFont('helvetica', 'bold')
  doc.text('TRABAJO:', 14, 46)
  doc.setFont('helvetica', 'normal')
  doc.text(tipo_trabajo || '', 40, 46)

  if (descripcion) {
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPCIÓN:', 14, 54)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(descripcion, 150)
    doc.text(lines, 14, 62)
  }

  // Tabla de materiales
  const startY = descripcion ? 72 : 60
  autoTable(doc, {
    startY,
    head: [['Material / Concepto', 'Proveedor', 'Cantidad', 'Unidad', 'C/Unit', 'Subtotal']],
    body: items.map(i => [
      i.material,
      i.proveedor || '—',
      i.cantidad,
      i.unidad,
      `$${i.costo_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${i.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]),
    headStyles: { fillColor: [232, 93, 38], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { cellWidth: 65 }, 4: { halign: 'right' }, 5: { halign: 'right' } }
  })

  // Totales
  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Subtotal materiales:`, 130, finalY)
  doc.text(`$${totales.materiales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' })

  doc.text(`Mano de obra:`, 130, finalY + 7)
  doc.text(`$${totales.mano_obra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 196, finalY + 7, { align: 'right' })

  if (totales.merma > 0) {
    doc.text(`Factor merma (${totales.pct_merma}%):`, 130, finalY + 14)
    doc.text(`$${totales.merma.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 196, finalY + 14, { align: 'right' })
  }

  // Total final
  doc.setFillColor(232, 93, 38)
  doc.rect(125, finalY + 18, 75, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', 130, finalY + 25)
  doc.text(`$${totales.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 196, finalY + 25, { align: 'right' })

  // Notas
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Cotización válida por 15 días. Precios sujetos a cambio sin previo aviso.', 14, finalY + 35)
  doc.text('Esta cotización no incluye IVA. Tiempo de entrega a convenir.', 14, finalY + 41)

  doc.save(`Cotizacion_${folio}_${cliente?.replace(/\s+/g, '_') || 'cliente'}.pdf`)
}
