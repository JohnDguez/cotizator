import { useState, useRef, useEffect } from 'react'
import catalogo from './data/catalogo.json'
import { generarPDF } from './utils/pdfGenerator'
import './App.css'

const SYSTEM_PROMPT = `Eres el asistente de cotización de As Diseño, una agencia de publicidad en Culiacán, Sinaloa. Calculas el costo de producción de anuncios publicitarios físicos con la lógica exacta de la agencia.

FÓRMULA OFICIAL DE AS DISEÑO (de la matriz real):
1. Suma de todos los insumos = Total Bruto
2. Utilidad 40% sobre bruto = bruto * 0.40
3. Gastos administrativos (default 0%)
4. Incentivos (default 0%)
5. Costo Venta Público = bruto + utilidad + gastos + incentivos
6. Precio final con IVA = costo_venta_publico * 1.16

PRECIOS INTERNOS:
- Mano de obra: $68/hora
- Grúa/elevador: $950/uso
- Gasolina: $25/estimado
- Comidas (trabajo >4h): $150/persona
- Vinil impreso fotográfico: $45/m²

MATERIALES Y PRECIOS DEL CATÁLOGO (solo los más usados):
Acrílico blanco 3mm: $1,300/hoja 1.20x2.40 (PLASCO)
Acrílico blanco 6mm: $2,400/hoja 1.20x2.40 (PLASCO)
Módulos LED 2-diodo: $90/tira de 20 módulos (PLASCO)
Módulos LED 3-diodo: $110/tira de 20 módulos (PLASCO)
Fuente poder 30W: $180 | 60W: $340 | 100W: $450 | 150W: $850 | 220W: $1,200 (PLASCO)
Silvatrim 3/4": $38/ml (PLASCO)
Lona banner blanca 3.20m: $2,111/rollo de 50m (ARCLAD)
Lona traslúcida Lumijet Pro-5 153cm 5 años: $153/ml (AVANCE)
Lona traslúcida 320cm 5 años: $305/ml (AVANCE)
Vinil de impresión 1.52m: $1,800/rollo 50m (PLASCO)
Vinil de corte 60cm: $55/ml (MAT.GRÁFICOS)
Vinil de corte traslúcido SM5 120cm: $80/ml (AVANCE)
Transfer papel 60cm: $1,733/rollo (PLASCO)
Perfil Zintro 1x1 cal.18: $202/tramo 6m (FETASA)
Perfil Zintro 1.5x1.5 cal.18: $310/tramo 6m (FETASA)
PTR cal.18 2x2: $407/tramo (FETASA)
Lámina galvanizada cal.24: $435/hoja (FETASA)
Soldadura 6011 1kg: $111 (FETASA)
Pintura secado rápido: $195/lt (BASA)
Cloroformo 1/2L: $360 (AEVA)
Lámparas fluorescentes 122cm: $38/pza
Balastros 2x32: $185/pza
Bases portafocos: $22/pza
Cable cal.14: $8.50/ml | cal.16: $11/ml

INSTRUCCIONES:
1. Extrae: tipo de trabajo, dimensiones, cantidad de piezas, iluminación, instalación en altura.
2. Si faltan dimensiones, pregunta brevemente.
3. Calcula cantidades reales con merma del 15%.
4. Usa precios del catálogo. Si es estimado, márcalo con (est.).
5. Responde siempre con el bloque JSON más un resumen de 2-3 líneas.

FORMATO JSON (obligatorio en cada cotización):
\`\`\`json
{
  "tipo_trabajo": "string",
  "descripcion": "string",
  "items": [
    { "material": "string", "proveedor": "string", "cantidad": 0, "unidad": "string", "costo_unitario": 0, "subtotal": 0 }
  ],
  "totales": {
    "total_bruto": 0,
    "pct_utilidad": 40,
    "utilidad": 0,
    "pct_gastos_admin": 0,
    "gastos_admin": 0,
    "pct_incentivos": 0,
    "incentivos": 0,
    "costo_venta_publico": 0,
    "iva": 0,
    "precio_final_con_iva": 0
  },
  "notas": "string"
}
\`\`\`

Habla siempre en español. Si el usuario pide ajustar algo, regenera el JSON completo.`

// ── Storage helpers ──────────────────────────────────────────────
const STORAGE_KEY = 'cotizador_as_historial'

function cargarHistorial() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function guardarHistorial(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
}

// ── Parsers ──────────────────────────────────────────────────────
function parseQuote(content) {
  const match = content.match(/```json\n?([\s\S]*?)```/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

function renderMessage(content) {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
}

function nuevoFolio() {
  return 'ASD-' + String(Date.now()).slice(-6)
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [historial, setHistorial] = useState(() => cargarHistorial())
  const [sesionActiva, setSesionActiva] = useState(null) // id de sesión activa
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)
  const [cliente, setCliente] = useState('')
  const [utilidad, setUtilidad] = useState(40)
  const [folio, setFolio] = useState(nuevoFolio)
  const [fecha] = useState(() => new Date().toLocaleDateString('es-MX'))
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Guarda la sesión activa en el historial cada vez que cambian los mensajes
  useEffect(() => {
    if (messages.length === 0) return
    const sesion = {
      id: sesionActiva || folio,
      folio,
      cliente,
      fecha,
      messages,
      quote,
      updatedAt: Date.now()
    }
    setSesionActiva(sesion.id)
    setHistorial(prev => {
      const sinEsta = prev.filter(s => s.id !== sesion.id)
      const nuevo = [sesion, ...sinEsta].slice(0, 50) // máximo 50 cotizaciones
      guardarHistorial(nuevo)
      return nuevo
    })
  }, [messages, quote])

  function nuevaCotizacion() {
    setMessages([])
    setQuote(null)
    setCliente('')
    setUtilidad(40)
    setFolio(nuevoFolio())
    setSesionActiva(null)
    setVistaHistorial(false)
    inputRef.current?.focus()
  }

  function abrirSesion(sesion) {
    setMessages(sesion.messages)
    setQuote(sesion.quote)
    setCliente(sesion.cliente || '')
    setFolio(sesion.folio)
    setSesionActiva(sesion.id)
    setVistaHistorial(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function eliminarSesion(e, id) {
    e.stopPropagation()
    const nuevo = historial.filter(s => s.id !== id)
    setHistorial(nuevo)
    guardarHistorial(nuevo)
    if (sesionActiva === id) nuevaCotizacion()
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      const txt = data.content?.[0]?.text || 'Error al obtener respuesta.'
      setMessages(prev => [...prev, { role: 'assistant', content: txt }])
      const parsed = parseQuote(txt)
      if (parsed) setQuote(parsed)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Verifica que VITE_ANTHROPIC_KEY está configurada.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  function handlePDF() {
    if (!quote) return
    generarPDF({ ...quote, cliente, folio, fecha })
  }

  function aplicarUtilidad() {
    if (!quote) return
    sendMessage(`Recalcula la cotización aplicando ${utilidad}% de utilidad.`)
  }

  const suggestions = [
    'Rotulación de anuncio luminoso backlit 4x1.20m con lona traslúcida y lámparas fluorescentes',
    'Letras 3D acrílico blanco 3mm, 60cm alto, texto "FARMACIA" (8 letras) con LED interior',
    'Bastidor metálico 3x1m con lona banner impresa full color para fachada',
    'Rotulación de vitrina con vinil de corte, área 2x1.5m, logo y datos',
    'Espectacular 6x3m lona backlit estructura PTR con iluminación interior',
  ]

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">A</div>
          <div>
            <div className="logo-name">As Diseño</div>
            <div className="logo-sub">Cotizador IA</div>
          </div>
        </div>

        {/* Botones principales */}
        <div className="sidebar-actions">
          <button className="btn-nueva" onClick={nuevaCotizacion}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
            Nueva cotización
          </button>
          <button className={`btn-historial ${vistaHistorial ? 'active' : ''}`} onClick={() => setVistaHistorial(v => !v)}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
            Historial ({historial.length})
          </button>
        </div>

        {/* Vista historial */}
        {vistaHistorial ? (
          <div className="historial-lista">
            {historial.length === 0 && (
              <div className="historial-empty">Sin cotizaciones guardadas</div>
            )}
            {historial.map(s => (
              <div key={s.id} className={`historial-item ${sesionActiva === s.id ? 'activa' : ''}`} onClick={() => abrirSesion(s)}>
                <div className="hi-folio">{s.folio}</div>
                <div className="hi-cliente">{s.cliente || 'Sin cliente'}</div>
                <div className="hi-tipo">{s.quote?.tipo_trabajo || '—'}</div>
                {s.quote?.totales?.precio_final_con_iva && (
                  <div className="hi-total">${s.quote.totales.precio_final_con_iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                )}
                <div className="hi-fecha">{s.fecha}</div>
                <button className="hi-del" onClick={e => eliminarSesion(e, s.id)}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="sidebar-section">
              <label className="sidebar-label">Cliente</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente..." />
            </div>

            <div className="sidebar-section">
              <label className="sidebar-label">Folio · Fecha</label>
              <div className="folio-badge">{folio}</div>
              <div className="folio-fecha">{fecha}</div>
            </div>

            <div className="sidebar-section">
              <label className="sidebar-label">% de Utilidad</label>
              <div className="utilidad-row">
                <input type="number" min="0" max="200" value={utilidad} onChange={e => setUtilidad(Number(e.target.value))} style={{ width: '70px' }} />
                <span className="utilidad-pct">%</span>
                {quote && <button className="btn-recalc" onClick={aplicarUtilidad}>Aplicar</button>}
              </div>
            </div>

            {quote && (
              <div className="quote-preview">
                <div className="quote-preview-title">Cotización activa</div>
                <div className="quote-type">{quote.tipo_trabajo}</div>
                <div className="quote-items">{quote.items?.length} conceptos</div>
                <div className="qp-numbers">
                  <div className="qp-row"><span>Bruto</span><span>${quote.totales?.total_bruto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  <div className="qp-row"><span>Público</span><span>${quote.totales?.costo_venta_publico?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  <div className="qp-row qp-final"><span>Con IVA</span><span>${quote.totales?.precio_final_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                </div>
                <button className="btn-pdf" onClick={handlePDF}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"/>
                  </svg>
                  Generar PDF
                </button>
              </div>
            )}

            <div className="sidebar-section" style={{ marginTop: 'auto' }}>
              <label className="sidebar-label">Catálogo cargado</label>
              <div className="catalog-stats">{catalogo.materiales.length} materiales · {Object.keys(catalogo.categorias).length} categorías</div>
              {Object.entries(catalogo.materiales.reduce((acc, m) => { acc[m.proveedor] = (acc[m.proveedor] || 0) + 1; return acc }, {}))
                .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, n]) => (
                  <div key={p} className="prov-row"><span>{p}</span><span>{n}</span></div>
                ))}
            </div>
          </>
        )}
      </aside>

      {/* ── CHAT ── */}
      <main className="chat-area">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h2>Describe el trabajo a cotizar</h2>
              <p>Cuéntame qué necesitas producir: tipo de anuncio, dimensiones, materiales, iluminación. La IA calcula con tus precios reales y aplica la fórmula de As Diseño.</p>
              <div className="suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && <div className="msg-avatar">IA</div>}
              <div className="msg-bubble">
                {msg.role === 'assistant' ? (
                  <>
                    <div className="msg-text">{renderMessage(msg.content)}</div>
                    {parseQuote(msg.content) && <QuoteCard quote={parseQuote(msg.content)} />}
                  </>
                ) : (
                  <div className="msg-text">{msg.content}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="msg-avatar">IA</div>
              <div className="msg-bubble"><div className="typing"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Describe el trabajo... (Enter para enviar, Shift+Enter para nueva línea)" rows={2} disabled={loading} />
            <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── QuoteCard ────────────────────────────────────────────────────
function QuoteCard({ quote }) {
  const [open, setOpen] = useState(false)
  if (!quote?.totales) return null
  const t = quote.totales
  return (
    <div className="quote-card">
      <div className="qc-header" onClick={() => setOpen(o => !o)}>
        <div>
          <div className="qc-title">{quote.tipo_trabajo}</div>
          <div className="qc-items">{quote.items?.length} conceptos · bruto ${t.total_bruto?.toLocaleString('es-MX')}</div>
        </div>
        <div className="qc-total">${t.precio_final_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} c/IVA</div>
        <span className="qc-toggle">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="qc-body">
          <table className="qc-table">
            <thead>
              <tr><th>Insumo</th><th>Prov.</th><th>Cant.</th><th>U.</th><th>C/U</th><th>Total</th></tr>
            </thead>
            <tbody>
              {quote.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.material}</td>
                  <td>{item.proveedor || '—'}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.unidad}</td>
                  <td>${item.costo_unitario?.toLocaleString('es-MX')}</td>
                  <td className="td-total">${item.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="qc-totales">
            <div className="qt-row"><span>Total Bruto</span><span>${t.total_bruto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
            <div className="qt-row"><span>Utilidad ({t.pct_utilidad}%)</span><span>+ ${t.utilidad?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
            {t.gastos_admin > 0 && <div className="qt-row"><span>Gastos Admin ({t.pct_gastos_admin}%)</span><span>+ ${t.gastos_admin?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>}
            {t.incentivos > 0 && <div className="qt-row"><span>Incentivos ({t.pct_incentivos}%)</span><span>+ ${t.incentivos?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>}
            <div className="qt-row qt-subtotal"><span>Costo Venta Público</span><span>${t.costo_venta_publico?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
            <div className="qt-row"><span>IVA (16%)</span><span>+ ${t.iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
            <div className="qt-row qt-final"><span>PRECIO FINAL C/IVA</span><span>${t.precio_final_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span></div>
          </div>
          {quote.notas && <div className="qc-notas">📝 {quote.notas}</div>}
        </div>
      )}
    </div>
  )
}
