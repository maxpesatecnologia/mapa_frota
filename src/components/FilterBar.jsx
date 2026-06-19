import { Search, SlidersHorizontal, X, CalendarRange } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

const FilterBar = () => {
  const { filters, setFilters, options, activeFilterCount, filtered } = useFleet();

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const clearAll = () => setFilters({ cliente: 'all', familia: 'all', status: 'all', operador: 'all', search: '', dataInicio: '', dataFim: '' });

  const selStyle = (active) => ({
    padding: '0.4rem 0.7rem',
    borderRadius: 8,
    fontSize: '0.8rem',
    border: `1px solid ${active ? '#E30613' : 'var(--border)'}`,
    background: active ? 'rgba(227,6,19,0.05)' : 'white',
    color: active ? '#E30613' : 'var(--text)',
    fontWeight: active ? 600 : 400,
    minWidth: 120,
  });

  return (
    <div style={{
      height: 'var(--filter-h)',
      background: 'white',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '0.75rem',
      flexShrink: 0,
      zIndex: 10,
    }}>
      <SlidersHorizontal size={16} color="#64748b" style={{ flexShrink: 0 }} />

      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Buscar frota, cliente, operador..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          style={{ paddingLeft: 30, width: 240, borderColor: filters.search ? '#E30613' : undefined }}
        />
        {filters.search && (
          <X size={12} color="#94a3b8" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
            onClick={() => set('search', '')} />
        )}
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <CalendarRange size={14} color="#94a3b8" />
        <input
          type="date"
          value={filters.dataInicio}
          onChange={e => set('dataInicio', e.target.value)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            border: `1px solid ${filters.dataInicio ? '#E30613' : 'var(--border)'}`,
            background: filters.dataInicio ? 'rgba(227,6,19,0.05)' : 'white',
            color: filters.dataInicio ? '#E30613' : 'var(--text)',
            fontWeight: filters.dataInicio ? 600 : 400,
          }}
        />
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>até</span>
        <input
          type="date"
          value={filters.dataFim}
          onChange={e => set('dataFim', e.target.value)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            border: `1px solid ${filters.dataFim ? '#E30613' : 'var(--border)'}`,
            background: filters.dataFim ? 'rgba(227,6,19,0.05)' : 'white',
            color: filters.dataFim ? '#E30613' : 'var(--text)',
            fontWeight: filters.dataFim ? 600 : 400,
          }}
        />
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Cliente */}
      <select value={filters.cliente} onChange={e => set('cliente', e.target.value)} style={selStyle(filters.cliente !== 'all')}>
        <option value="all">Todos os Clientes</option>
        {options.clientes.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Família */}
      <select value={filters.familia} onChange={e => set('familia', e.target.value)} style={selStyle(filters.familia !== 'all')}>
        <option value="all">Todas as Famílias</option>
        {options.familias.slice(1).map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Status */}
      <select value={filters.status} onChange={e => set('status', e.target.value)} style={selStyle(filters.status !== 'all')}>
        <option value="all">Todos os Status</option>
        {options.statuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Operador */}
      <select value={filters.operador} onChange={e => set('operador', e.target.value)} style={selStyle(filters.operador !== 'all')}>
        <option value="all">Todos os Operadores</option>
        {options.operadores.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
      </select>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(227,6,19,0.07)',
            color: '#E30613',
            fontSize: '0.78rem',
            fontWeight: 600,
            border: '1px solid rgba(227,6,19,0.2)',
          }}
        >
          <X size={13} />
          Limpar ({activeFilterCount})
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Result count */}
      <div style={{ fontSize: '0.78rem', color: '#64748b', flexShrink: 0 }}>
        <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> equipamento(s)
      </div>
    </div>
  );
};

export default FilterBar;
