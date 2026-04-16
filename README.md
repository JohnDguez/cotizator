# Cotizador IA — As Diseño

App interna de cotización de producción publicitaria con IA conversacional.

## Stack
- React + Vite
- Claude claude-sonnet-4-20250514 (Anthropic API)
- jsPDF para generación de PDFs
- Sin backend — todo corre en el browser

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Agregar API key de Anthropic
# Crea un archivo .env.local en la raíz:
echo "VITE_ANTHROPIC_KEY=sk-ant-..." > .env.local

# 3. Correr en desarrollo
npm run dev

# 4. Build para producción
npm run build
```

## Agregar API Key en la app

En `src/App.jsx`, la línea del fetch incluye el header:
```js
'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY
```

Agrega tu API key en `.env.local` (nunca al repositorio).

## Actualizar precios del catálogo

Edita `src/data/catalogo.json`. Cada material tiene:
```json
{
  "id": 1,
  "material": "NOMBRE DEL MATERIAL",
  "costo": 1900.00,
  "medida": "1,22X2,44",
  "proveedor": "PLASCO",
  "categoria": "laminas_acrilicos"
}
```

## Deploy en Vercel

```bash
# Conecta el repo a Vercel, agrega la variable:
# VITE_ANTHROPIC_KEY = sk-ant-...
vercel --prod
```

## Categorías de materiales
- `laminas_acrilicos` — Láminas, acrílicos, PVC, Coroplast
- `estructura_metalica` — Perfiles, tubos, ángulos, soldadura
- `viniles_lonas` — Viniles de impresión y corte
- `lonas` — Lonas banner, traslúcidas, backlit
- `leds_fuentes` — Módulos LED, fuentes de poder
- `pinturas_resinas` — Pinturas, bondos, thiner, selladores
- `tintas_insumos` — Tintas y consumibles de impresión
- `displays_estructuras` — Displays, roll-ups, stands
- `consumibles` — Cintas, transfer, velcro, otros
