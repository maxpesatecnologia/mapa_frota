import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Building2, MapPin } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { getStatus } from '../utils/statusConfig';
import FleetCard from './FleetCard';

const ClientGroup = ({ cliente, items }) => {
  const [open, setOpen] = useState(true);

  const statusSummary = useMemo(() => {
    const counts = {};
    items.forEach(i => {
      const raw = i.status || 'D';
      counts[raw] = (counts[raw] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([raw, count]) => ({ raw, count, cfg: getStatus(raw) }));
  }, [items]);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Group header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.6rem 1rem',
          background: '#f8fafc',
          borderRadius: open ? '10px 10px 0 0' : 10,
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
      >
        {open
          ? <ChevronDown size={15} color="#64748b" style={{ flexShrink: 0 }} />
          : <ChevronRight size={15} color="#64748b" style={{ flexShrink: 0 }} />
        }
        <Building2 size={15} color="#64748b" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', flexShrink: 0 }}>
          {cliente || 'SEM CLIENTE'}
        </span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700,
          background: '#e2e8f0', color: '#475569',
          padding: '1px 7px', borderRadius: 20, flexShrink: 0,
        }}>
          {items.length}
        </span>

        {/* Status mini pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginLeft: '0.25rem' }}>
          {statusSummary.map(({ raw, count, cfg }) => (
            <span key={raw} style={{
              fontSize: '0.67rem', fontWeight: 600,
              padding: '1px 7px', borderRadius: 20,
              background: cfg.bg, color: cfg.color,
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
              {count} {cfg.label}
            </span>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <MapPin size={13} color="#cbd5e1" />
      </div>

      {/* Cards grid */}
      {open && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem',
          background: '#fafbfd',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
        }}>
          {items.map((item, i) => (
            <FleetCard key={item.id || `${item.placa || item.frota}-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupedView = () => {
  const { filtered } = useFleet();

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(item => {
      const key = item.cliente || '';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (!a && b) return 1;
      if (a && !b) return -1;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: '0.75rem',
      }}>
        <Building2 size={48} color="#e2e8f0" />
        <h3 style={{ fontWeight: 600, color: '#94a3b8' }}>Nenhum equipamento encontrado</h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Ajuste os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      {groups.map(([cliente, items]) => (
        <ClientGroup key={cliente || '__sem__'} cliente={cliente} items={items} />
      ))}
    </div>
  );
};

export default GroupedView;
