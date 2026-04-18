import { useState, useRef, useEffect } from 'react'
import catalogo from './data/catalogo.json'
import { generarPDF } from './utils/pdfGenerator'
import './App.css'

const SYSTEM_PROMPT = `Eres el asistente de cotización de As Diseño, una agencia de publicidad en Culiacán, Sinaloa. Calculas el costo de producción de anuncios publicitarios físicos con la lógica exacta de la agencia.

FÓRMULA OFICIAL DE AS DISEÑO:
1. Suma de todos los insumos = Total Bruto
2. Utilidad 40% = bruto * 0.40
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

MATERIALES DEL CATÁLOGO:
Acrílico blanco 3mm: $1,300/hoja 1.20x2.40 (PLASCO)
Acrílico blanco 6mm: $2,400/hoja 1.20x2.40 (PLASCO)
Módulos LED 2-diodo: $90/tira 20 módulos (PLASCO)
Módulos LED 3-diodo: $110/tira 20 módulos (PLASCO)
Fuente poder 30W:$180 | 60W:$340 | 100W:$450 | 150W:$850 | 220W:$1,200 (PLASCO)
Silvatrim 3/4": $38/ml (PLASCO)
Lona banner blanca 3.20m: $2,111/rollo 50m (ARCLAD)
Lona traslúcida Lumijet Pro-5 153cm: $153/ml (AVANCE)
Lona traslúcida 320cm: $305/ml (AVANCE)
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
Balastros 2x32: $185/pza | Bases portafocos: $22/pza
Cable cal.14: $8.50/ml | cal.16: $11/ml

════════════════════════════════════════
VARIABLES DE COMPLEJIDAD — MUY IMPORTANTE
════════════════════════════════════════

Si el usuario adjunta una imagen (logo, boceto, tipografía, medidas), analízala visualmente y extrae:
- Número exacto de letras/elementos
- Tipo de forma: recta, curva, cursiva, serif con remates, formas orgánicas
- Complejidad de corte estimada

COMPLEJIDAD TIPOGRÁFICA (afecta horas de mano de obra):
- BAJA (1x): letras bold, sans-serif, sin remates, formas rectangulares simples. Ej: Arial, Helvética, Impact. +0% tiempo
- MEDIA (1.5x): letras con remates moderados, serif clásico, formas mixtas. Ej: Times, Garamond. +50% tiempo
- ALTA (2x): cursivas, scripts, letras con swashes, formas orgánicas, logos con curvas complejas. Ej: brush scripts, logotipos custom. +100% tiempo
- MUY ALTA (2.5x): formas muy irregulares, letras entrelazadas, ilustraciones integradas, detalles finos. +150% tiempo

ALTURA Y TIPO DE INSTALACIÓN (siempre preguntar si no se menciona):
Altura del anuncio:
- 0-2m (a mano): sin costo extra de grúa
- 2-4m: grúa chica $950
- 4-8m: grúa mediana $1,800 (est.)
- 8m+: grúa grande $3,500 (est.) + andamios $200/día

Superficie de instalación (afecta materiales de fijación):
- Tablaroca/Drywall: taquetes Toggler $15/pza, se necesitan más puntos de anclaje
- Durock/Cemento: taquetes expansivos 3/8" $10/pza, tornillos inoxidables
- Block/Ladrillo: taquetes de impacto $8/pza
- Concreto: taquetes hilti $25/pza, taladro de renta $300/día (est.)
- Lámina metálica: tornillos autoperforantes $0.20/pza, soldadura si aplica
- Madera/MDF: tornillos de madera $0.15/pza
- Fachada con perfil existente: verificar compatibilidad, puede requerir adaptador

CHECKLIST — preguntar si no está en la descripción o imagen:
1. ¿Dimensiones totales del anuncio? (ancho x alto)
2. ¿A qué altura va instalado?
3. ¿Sobre qué superficie se instala? (tablaroca, durock, concreto, lámina, etc.)
4. ¿Lleva iluminación? (LED, fluorescente, sin luz)
5. ¿Es interior o exterior? (exterior requiere materiales resistentes a intemperie)
6. ¿Cuántas piezas o módulos?

Si el usuario adjunta imagen: analízala primero, extrae toda la info posible, y solo pregunta lo que NO puedas determinar visualmente.

INSTRUCCIONES DE CÁLCULO:
- Horas base por tipo: letras 3D simples 2h/letra, backlit 6-8h total, bastidor 3-4h, rotulación 1-2h
- Multiplica horas por factor de complejidad tipográfica
- Suma materiales de instalación según superficie
- Añade grúa según altura
- Merma 15% en lonas y viniles, 10% en acrílicos

FORMATO JSON (siempre en cada cotización completa):
\`\`\`json
{
  "tipo_trabajo": "string",
  "descripcion": "string",
  "complejidad_tipografica": "BAJA|MEDIA|ALTA|MUY ALTA",
  "altura_instalacion": "string",
  "superficie_instalacion": "string",
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

Habla siempre en español. Si el usuario adjunta imagen, coméntale qué observaste antes de cotizar.`

// ── Storage ──────────────────────────────────────────────────────
const STORAGE_KEY = 'cotizador_as_historial'
function cargarHistorial() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function guardarHistorial(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
}

// ── Helpers ──────────────────────────────────────────────────────
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

// Convierte File a base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [historial, setHistorial] = useState(() => cargarHistorial())
  const [sesionActiva, setSesionActiva] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)
  const [cliente, setCliente] = useState('')
  const [utilidad, setUtilidad] = useState(40)
  const [folio, setFolio] = useState(nuevoFolio)
  const [fecha] = useState(() => new Date().toLocaleDateString('es-MX'))
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const [imagenes, setImagenes] = useState([]) // [{file, base64, preview, mediaType}]
  const [dragging, setDragging] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Usar folio como ID estable siempre
  const idSesion = sesionActiva || folio

  useEffect(() => {
    if (messages.length === 0) return
    // Limpiar blob URLs de imágenes antes de guardar (expiran al recargar)
    const msgsSinBlobs = messages.map(m => {
      if (!m._display?.imagenes) return m
      return { ...m, _display: { ...m._display, imagenes: m._display.imagenes.map(i => ({ ...i, preview: null })) } }
    })
    const sesion = { id: idSesion, folio, cliente, fecha, messages: msgsSinBlobs, quote, updatedAt: Date.now() }
    if (!sesionActiva) setSesionActiva(idSesion)
    setHistorial(prev => {
      const nuevo = [sesion, ...prev.filter(s => s.id !== sesion.id)].slice(0, 50)
      guardarHistorial(nuevo)
      return nuevo
    })
  }, [messages, quote])

  // Actualizar cliente en historial por separado sin crear duplicados
  useEffect(() => {
    if (messages.length === 0) return
    setHistorial(prev => {
      const existe = prev.find(s => s.id === idSesion)
      if (!existe) return prev
      const actualizada = { ...existe, cliente }
      const nuevo = [actualizada, ...prev.filter(s => s.id !== idSesion)]
      guardarHistorial(nuevo)
      return nuevo
    })
  }, [cliente])

  function nuevaCotizacion() {
    setMessages([]); setQuote(null); setCliente(''); setUtilidad(40)
    setFolio(nuevoFolio()); setSesionActiva(null); setVistaHistorial(false)
    setImagenes([])
    inputRef.current?.focus()
  }

  function abrirSesion(sesion) {
    setMessages(sesion.messages); setQuote(sesion.quote)
    setCliente(sesion.cliente || ''); setFolio(sesion.folio)
    setSesionActiva(sesion.id); setVistaHistorial(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function eliminarSesion(e, id) {
    e.stopPropagation()
    const nuevo = historial.filter(s => s.id !== id)
    setHistorial(nuevo); guardarHistorial(nuevo)
    if (sesionActiva === id) nuevaCotizacion()
  }

  async function handleImageSelect(e) {
    await procesarArchivos(e.target.files)
    e.target.value = ''
  }

  async function procesarArchivos(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    const nuevas = await Promise.all(imgs.map(async file => {
      const base64 = await fileToBase64(file)
      const preview = URL.createObjectURL(file)
      return { file, base64, preview, mediaType: file.type, name: file.name }
    }))
    setImagenes(prev => [...prev, ...nuevas].slice(0, 4))
  }

  function quitarImagen(idx) {
    setImagenes(prev => prev.filter((_, i) => i !== idx))
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    await procesarArchivos(e.dataTransfer.files)
  }

  async function sendMessage(text) {
    if ((!text.trim() && imagenes.length === 0) || loading) return

    // Construir content del mensaje del usuario
    let userContent
    if (imagenes.length > 0) {
      userContent = [
        ...imagenes.map(img => ({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 }
        })),
        { type: 'text', text: text.trim() || 'Analiza estas imágenes para la cotización.' }
      ]
    } else {
      userContent = text.trim()
    }

    const userMsg = {
      role: 'user',
      content: userContent,
      // Para mostrar en el chat
      _display: { text: text.trim(), imagenes: imagenes.map(i => ({ preview: i.preview, name: i.name })) }
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setImagenes([])
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
    'Letras 3D acrílico blanco 3mm, 60cm alto, texto "FARMACIA" (8 letras bold), LED interior, fachada a 3m de altura sobre tablaroca',
    'Rotulación backlit 4x1.20m lona traslúcida, fluorescentes, instalación a 5m sobre concreto',
    'Bastidor 3x1m lona banner full color, fachada exterior a 2.5m sobre block',
    'Rotulación vitrina vinil de corte, 2x1.5m, a nivel de piso sobre vidrio',
  ]

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">A</div>
          <div><div className="logo-name">As Diseño</div><div className="logo-sub">Cotizador IA</div></div>
        </div>

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

        {vistaHistorial ? (
          <div className="historial-lista">
            {historial.length === 0 && <div className="historial-empty">Sin cotizaciones guardadas</div>}
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
                {quote.complejidad_tipografica && (
                  <div className={`complejidad-badge c-${quote.complejidad_tipografica.toLowerCase().replace(' ', '-')}`}>
                    Complejidad {quote.complejidad_tipografica}
                  </div>
                )}
                {quote.superficie_instalacion && (
                  <div className="instalacion-info">📍 {quote.altura_instalacion} · {quote.superficie_instalacion}</div>
                )}
                <div className="quote-items">{quote.items?.length} conceptos</div>
                <div className="qp-numbers">
                  <div className="qp-row"><span>Bruto</span><span>${quote.totales?.total_bruto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  <div className="qp-row"><span>Público</span><span>${quote.totales?.costo_venta_publico?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  <div className="qp-row qp-final"><span>Con IVA</span><span>${quote.totales?.precio_final_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                </div>
                <button className="btn-pdf" onClick={handlePDF}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"/></svg>
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
      <main className="chat-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>

        {/* Drag overlay */}
        {dragging && (
          <div className="drag-overlay">
            <div className="drag-overlay-inner">
              <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
              <span>Suelta la imagen para adjuntarla</span>
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h2>Describe el trabajo a cotizar</h2>
              <p>Escribe la descripción o <strong>adjunta una imagen</strong> del logo, tipografía o boceto. La IA analiza la complejidad visual y pregunta la altura e instalación antes de calcular.</p>
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
                  <div className="msg-user-content">
                    {msg._display?.imagenes?.length > 0 && (
                      <div className="msg-images">
                        {msg._display.imagenes.map((img, ii) => (
                          <img key={ii} src={img.preview} alt={img.name} className="msg-img-thumb" />
                        ))}
                      </div>
                    )}
                    {msg._display?.text && <div className="msg-text">{msg._display.text}</div>}
                    {!msg._display && <div className="msg-text">{typeof msg.content === 'string' ? msg.content : ''}</div>}
                  </div>
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

        {/* Preview de imágenes adjuntas */}
        {imagenes.length > 0 && (
          <div className="img-preview-bar">
            {imagenes.map((img, i) => (
              <div key={i} className="img-preview-item">
                <img src={img.preview} alt={img.name} />
                <button className="img-remove" onClick={() => quitarImagen(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className={`input-area ${dragging ? "drag-over" : ""}`}>
          <div className="input-wrapper">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple hidden />
            <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Adjuntar imagen (logo, boceto, tipografía)">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
            </button>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Describe el trabajo o adjunta imagen... (Enter para enviar)" rows={2} disabled={loading} />
            <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || (!input.trim() && imagenes.length === 0)}>
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
          {(quote.complejidad_tipografica || quote.superficie_instalacion) && (
            <div className="qc-meta">
              {quote.complejidad_tipografica && <span className={`complejidad-badge c-${quote.complejidad_tipografica.toLowerCase().replace(' ', '-')}`}>Complejidad {quote.complejidad_tipografica}</span>}
              {quote.altura_instalacion && <span className="meta-tag">📏 {quote.altura_instalacion}</span>}
              {quote.superficie_instalacion && <span className="meta-tag">🧱 {quote.superficie_instalacion}</span>}
            </div>
          )}
          <table className="qc-table">
            <thead><tr><th>Insumo</th><th>Prov.</th><th>Cant.</th><th>U.</th><th>C/U</th><th>Total</th></tr></thead>
            <tbody>
              {quote.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.material}</td><td>{item.proveedor || '—'}</td><td>{item.cantidad}</td>
                  <td>{item.unidad}</td><td>${item.costo_unitario?.toLocaleString('es-MX')}</td>
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
