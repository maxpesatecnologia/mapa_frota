import React from 'react';
import { User, Building2, Calendar, Settings2 } from 'lucide-react';
import { getStatus } from '../utils/statusConfig';

const FleetCard = ({ item }) => {
  const s = getStatus(item.status);

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      borderLeft: `4px solid ${s.border}`,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
      }}
    >
      {/* Status header */}
      <div style={{
        background: s.bg,
        padding: '0.5rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${s.border}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: s.dot,
            boxShadow: `0 0 0 2px ${s.dot}33`,
          }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {s.label}
          </span>
        </div>
        {item.data && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            background: '#1e293b', borderRadius: 6,
            padding: '2px 7px', color: '#38bdf8',
          }}>
            <Calendar size={10} color="#38bdf8" />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.3px' }}>{item.data}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.85rem' }}>
        {/* Frota + Família */}
        <div style={{ marginBottom: '0.6rem' }}>
          <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.15rem', color: '#1e293b', lineHeight: 1 }}>
            {item.frota || '—'}
          </div>
          {item.equipamento && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              {item.equipamento}
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: '0.65rem' }} />

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {item.cliente && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.cliente}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: item.operador ? '#374151' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.operador || 'Sem operador'}
            </span>
          </div>
          {item.configuracao && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Settings2 size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.configuracao}
              </span>
            </div>
          )}
        </div>

        {/* Família badge */}
        {item.familia && (
          <div style={{ marginTop: '0.65rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: '#f1f5f9', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {item.familia}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetCard;
