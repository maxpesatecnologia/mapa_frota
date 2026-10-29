import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

// Recursos expostos (somente leitura). `order` define a ordenação estável da paginação.
const RECURSOS = {
  programacao: { order: ['data', 'placa', 'id'], dateCol: 'data' },
  equipamentos: { order: ['placa'] },
  clientes: { order: ['id'] },
  operadores: { order: ['id'] },
  status_programacao: { order: ['id'] },
  motivos: { order: ['id'] },
  itens_motivo: { order: ['id'] },
  programacao_anexos: { order: ['created_at', 'id'] },
}

const MAX_LIMIT = 1000
const RESERVADOS = new Set(['recurso', 'limit', 'offset', 'data_ini', 'data_fim', 'order'])

const keyOk = (recebida) => {
  const esperada = process.env.API_KEY
  if (!esperada || !recebida) return false
  const a = Buffer.from(recebida)
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const auth = req.headers.authorization || ''
  const key = req.headers['x-api-key'] || (auth.startsWith('Bearer ') ? auth.slice(7) : '')
  if (!keyOk(key)) return res.status(401).json({ error: 'API key inválida ou ausente' })

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !sk) return res.status(500).json({ error: 'Servidor não configurado' })
  const supabase = createClient(url, sk, { auth: { persistSession: false } })

  const q = req.query
  const recurso = q.recurso
  if (!recurso) {
    return res.status(200).json({ recursos: Object.keys(RECURSOS) })
  }
  const cfg = RECURSOS[recurso]
  if (!cfg) return res.status(404).json({ error: `Recurso desconhecido: ${recurso}`, recursos: Object.keys(RECURSOS) })

  const limit = Math.min(Math.max(parseInt(q.limit) || 500, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(q.offset) || 0, 0)

  let query = supabase.from(recurso).select('*', { count: 'exact' })

  if (cfg.dateCol) {
    if (q.data_ini) query = query.gte(cfg.dateCol, q.data_ini)
    if (q.data_fim) query = query.lte(cfg.dateCol, q.data_fim)
  }
  // Demais parâmetros = filtro de igualdade por coluna (ex.: ?placa=ABC1234&status=T)
  for (const [col, val] of Object.entries(q)) {
    if (RESERVADOS.has(col) || typeof val !== 'string') continue
    if (!/^[a-z_]+$/.test(col)) return res.status(400).json({ error: `Coluna inválida: ${col}` })
    query = query.eq(col, val)
  }
  for (const col of cfg.order) query = query.order(col, { ascending: true })

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) return res.status(400).json({ error: error.message })

  const proximo = offset + limit < count ? offset + limit : null
  res.status(200).json({ recurso, total: count, limit, offset, proximo_offset: proximo, data })
}
