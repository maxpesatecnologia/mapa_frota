import React from 'react';
import { Truck, CheckCircle, Circle, Wrench, TrendingUp, Clock } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

const KpiItem = ({ icon, value, label, color, bg }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.5rem',
    borderRight: '1px solid #1e293b',
    flexShrink: 0,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {React.cloneElement(icon, { size: 18, color })}
    </div>
    <div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  </div>
);

const KpiBar = () => {
  const { kpis, uploadedAt, filtered, rawData } = useFleet();

  const fmtTime = (d) => d
    ? `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '—';

  return (
    <div style={{
      height: 'var(--kpi-h)',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <KpiItem
        icon={<Truck />}
        value={kpis.total}
        label="Total da Frota"
        color="#94a3b8"
        bg="rgba(148,163,184,0.1)"
      />
      <KpiItem
        icon={<CheckCircle />}
        value={kpis.operando}
        label="Operando"
        color="#16a34a"
        bg="rgba(22,163,74,0.15)"
      />
      <KpiItem
        icon={<Circle />}
        value={kpis.disponivel}
        label="Disponível"
        color="#94a3b8"
        bg="rgba(148,163,184,0.1)"
      />
      <KpiItem
        icon={<Wrench />}
        value={kpis.manutencao}
        label="Em Manutenção"
        color="#ef4444"
        bg="rgba(239,68,68,0.12)"
      />
      <KpiItem
        icon={<TrendingUp />}
        value={`${kpis.taxa}%`}
        label="Taxa de Ocupação"
        color="#FF6A00"
        bg="rgba(255,106,0,0.12)"
      />

      {/* Gauge bar */}
      <div style={{ flex: 1, padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ocupação da frota</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: kpis.taxa >= 70 ? '#16a34a' : kpis.taxa >= 40 ? '#FF6A00' : '#ef4444' }}>
            {kpis.taxa}%
          </span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${kpis.taxa}%`,
            background: kpis.taxa >= 70 ? '#16a34a' : kpis.taxa >= 40 ? '#FF6A00' : '#ef4444',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
        {filtered.length !== rawData.length && (
          <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 6 }}>
            Mostrando {filtered.length} de {rawData.length} equipamentos
          </div>
        )}
      </div>

      {/* Updated at */}
      <div style={{ padding: '0 1.5rem', borderLeft: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.7rem' }}>
          <Clock size={12} />
          <span>Atualizado em</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>
          {fmtTime(uploadedAt)}
        </div>
      </div>
    </div>
  );
};

export default KpiBar;
