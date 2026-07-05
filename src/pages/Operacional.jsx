import { useMemo, useState } from 'react';
import { useCadastros } from '../context/CadastrosContext';
import { getStatus } from '../utils/statusConfig';
import { Search, Truck, CalendarDays, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmtDateLong = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

/* ─── sub-componentes ──────────────────────────────────────────────────────── */
const StatusBadge = ({ raw }) => {
  const s = getStatus(raw);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: s.dot, flexShrink: 0,
      }} />
      {s.label || raw || '—'}
    </span>
  );
};


/* ─── componente principal ─────────────────────────────────────────────────── */
const Operacional = () => {
  const { programacoes } = useCadastros();

  const [search,           setSearch]           = useState('');
  const [filterStatus,     setFilterStatus]     = useState('all');
  const [filterFamilia,    setFilterFamilia]    = useState('all');
  const [filterCliente,    setFilterCliente]    = useState('all');
  const [filterPlaca,      setFilterPlaca]      = useState('all');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim,    setFilterDataFim]    = useState('');
  const [collapsed,        setCollapsed]        = useState({});
  const [showFilters,      setShowFilters]      = useState(false);

  /* opções únicas para os dropdowns */
  const { statuses, familias, clientes, placas } = useMemo(() => {
    const st = new Set(), fa = new Set(), cl = new Set(), pl = new Set();
    programacoes.forEach(r => {
      if (r.status)  st.add(r.status);
      if (r.familia) fa.add(r.familia);
      if (r.cliente) cl.add(r.cliente);
      if (r.placa)   pl.add(r.placa);
    });
    return {
      statuses: [...st].sort(),
      familias: [...fa].sort(),
      clientes: [...cl].sort(),
      placas:   [...pl].sort(),
    };
  }, [programacoes]);

  /* filtrar e ordenar — mais recente primeiro */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return programacoes
      .filter(r => {
        if (filterStatus     !== 'all' && r.status  !== filterStatus)  return false;
        if (filterFamilia    !== 'all' && r.familia !== filterFamilia) return false;
        if (filterCliente    !== 'all' && r.cliente !== filterCliente) return false;
        if (filterPlaca      !== 'all' && r.placa   !== filterPlaca)   return false;
        if (filterDataInicio && String(r.data || '').slice(0, 10) < filterDataInicio) return false;
        if (filterDataFim    && String(r.data || '').slice(0, 10) > filterDataFim)    return false;
        if (q) {
          const hay = [r.placa, r.frota, r.equipamento, r.operador, r.cliente, r.familia]
            .join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = String(a.data || ''), db = String(b.data || '');
        if (da > db) return -1;
        if (da < db) return 1;
        return (a.placa || a.frota || '').localeCompare(b.placa || b.frota || '', 'pt-BR');
      });
  }, [programacoes, search, filterStatus, filterFamilia, filterCliente, filterPlaca, filterDataInicio, filterDataFim]);

  /* agrupar por data */
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(r => {
      const key = String(r.data || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return [...map.entries()]; // [ [data, [rows...]], ... ]
  }, [filtered]);

  const [displayCount, setDisplayCount] = useState(15);
  const displayedGrouped = useMemo(() => grouped.slice(0, displayCount), [grouped, displayCount]);

const hasFilters = search || filterStatus !== 'all' || filterFamilia !== 'all' || filterCliente !== 'all' || filterPlaca !== 'all' || filterDataInicio || filterDataFim;

  const clearFilters = () => {
    setSearch(''); setFilterStatus('all');
    setFilterFamilia('all'); setFilterCliente('all');
    setFilterPlaca('all');
    setFilterDataInicio(''); setFilterDataFim('');
  };

  const toggleDate = (key) =>
    setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (programacoes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem' }}>
        <Truck size={48} color="#e2e8f0" />
        <h3 style={{ color: '#94a3b8', margin: 0 }}>Nenhuma programação encontrada</h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0 }}>Acesse <strong>Importar</strong> para adicionar dados da frota.</p>
      </div>
    );
  }

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f4f6f8' }}>

      {/* ── cabeçalho ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '1rem 1.25rem 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Mapa Operacional</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Histórico completo da programação — do mais antigo ao mais recente
            </p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 0.9rem', borderRadius: 8, cursor: 'pointer',
              background: showFilters ? '#0f172a' : 'white',
              color: showFilters ? 'white' : '#475569',
              border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <Filter size={14} /> Filtros
            {hasFilters && (
              <span style={{
                background: '#E30613', color: 'white',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>!</span>
            )}
          </button>
        </div>

{/* Filtros */}
        {showFilters && (
          <div style={{
            background: 'white', borderRadius: 10, padding: '0.85rem 1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '0.75rem',
            display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* busca */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar placa, frota, operador..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  border: '1px solid #e2e8f0', borderRadius: 7,
                  fontSize: '0.8rem', color: '#1e293b', outline: 'none',
                }}
              />
            </div>

            {/* status */}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="all">Todos os status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* família */}
            <select value={filterFamilia} onChange={e => setFilterFamilia(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="all">Todas as famílias</option>
              {familias.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* cliente */}
            <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="all">Todos os clientes</option>
              {clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* placa */}
            <select value={filterPlaca} onChange={e => setFilterPlaca(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="all">Todas as placas</option>
              {placas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* separador visual */}
            <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

            {/* data início */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>De</label>
              <input
                type="date"
                value={filterDataInicio}
                onChange={e => setFilterDataInicio(e.target.value)}
                max={filterDataFim || undefined}
                style={{
                  padding: '0.43rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 7,
                  fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>

            {/* data fim */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Até</label>
              <input
                type="date"
                value={filterDataFim}
                onChange={e => setFilterDataFim(e.target.value)}
                min={filterDataInicio || undefined}
                style={{
                  padding: '0.43rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 7,
                  fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.75rem', border: '1px solid #fca5a5', borderRadius: 7, background: '#fff7f7', color: '#E30613', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                <X size={13} /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── conteúdo rolável ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1.25rem' }}>
        {displayedGrouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            Nenhum registro encontrado para os filtros selecionados.
          </div>
        ) : displayedGrouped.map(([dateKey, rows]) => {
          const isOpen = !collapsed[dateKey];
          return (
            <div key={dateKey} style={{ marginBottom: '0.75rem' }}>

              {/* cabeçalho do grupo (data) */}
              <button
                onClick={() => toggleDate(dateKey)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#0f172a', color: 'white',
                  border: 'none', borderRadius: isOpen ? '10px 10px 0 0' : 10,
                  padding: '0.6rem 1rem', cursor: 'pointer',
                  transition: 'border-radius 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CalendarDays size={15} color="#94a3b8" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', textTransform: 'capitalize' }}>
                    {fmtDateLong(dateKey)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    background: '#E30613', color: 'white',
                    borderRadius: 99, padding: '1px 9px',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {rows.length} {rows.length === 1 ? 'equipamento' : 'equipamentos'}
                  </span>
                  {isOpen ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                </div>
              </button>

              {/* tabela do grupo */}
              {isOpen && (
                <div style={{
                  background: 'white',
                  borderRadius: '0 0 10px 10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {['Placa / Frota', 'Equipamento', 'Família', 'Status', 'Cliente', 'Operador', 'Hrs Trabalhadas', 'Quebra'].map(h => (
                          <th key={h} style={{
                            padding: '0.5rem 0.85rem', textAlign: 'left',
                            fontSize: '0.68rem', fontWeight: 700, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.4px',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const temQuebra = r.houve_quebra === true;
                        return (
                          <tr key={r.id || i} style={{
                            borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: temQuebra ? '#fff7f7' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = temQuebra ? '#fee2e2' : '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = temQuebra ? '#fff7f7' : 'transparent'}
                          >
                            {/* Placa / Frota */}
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                {r.placa || '—'}
                              </div>
                              {r.frota && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Frota {r.frota}</div>
                              )}
                            </td>

                            {/* Equipamento */}
                            <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#374151' }}>
                              {r.equipamento || '—'}
                            </td>

                            {/* Família */}
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              {r.familia ? (
                                <span style={{
                                  background: '#f1f5f9', color: '#475569',
                                  borderRadius: 6, padding: '2px 8px',
                                  fontSize: '0.73rem', fontWeight: 600,
                                }}>
                                  {r.familia}
                                </span>
                              ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              <StatusBadge raw={r.status} />
                            </td>

                            {/* Cliente */}
                            <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#374151', maxWidth: 200 }}>
                              {r.cliente ? (
                                <span style={{ fontWeight: 500 }}>{r.cliente}</span>
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Sem cliente</span>
                              )}
                            </td>

                            {/* Operador */}
                            <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#475569' }}>
                              {r.operador || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>

                            {/* Horas trabalhadas */}
                            <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#374151', textAlign: 'center' }}>
                              {r.total_horas
                                ? <span style={{ fontWeight: 600 }}>{r.total_horas}h</span>
                                : <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>

                            {/* Quebra */}
                            <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                              {temQuebra ? (
                                <span title={[r.motivo, r.item_motivo].filter(Boolean).join(' › ')}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#fee2e2', color: '#E30613',
                                    borderRadius: 6, padding: '2px 8px',
                                    fontSize: '0.72rem', fontWeight: 700,
                                    cursor: 'default',
                                  }}>
                                  ⚠ Quebra
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* Botão Carregar Mais Dias */}
        {grouped.length > displayedGrouped.length && (
          <div style={{ padding: '1rem', textAlign: 'center', marginTop: '1rem' }}>
            <button 
              onClick={() => setDisplayCount(c => c + 15)}
              style={{
                padding: '0.55rem 1.5rem', borderRadius: 8, border: '1px solid #cbd5e1',
                background: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Mostrar dias anteriores ({displayedGrouped.length} de {grouped.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Operacional;
