import { useEffect, useRef, useMemo } from 'react';
import { MapPin, Info } from 'lucide-react';
import { useCadastros } from '../context/CadastrosContext';
import { getClientCoords } from '../utils/clientCoords';
import { getStatus } from '../utils/statusConfig';

const MapView = () => {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef     = useRef([]);
  const { programacoes } = useCadastros();

  // Status mais recente por equipamento (placa || frota)
  const equipAtual = useMemo(() => {
    const map = new Map();
    programacoes.forEach(r => {
      const key = r.placa || r.frota;
      if (!key) return;
      const prev = map.get(key);
      const rDate = String(r.data || '');
      const prevDate = prev ? String(prev.data || '') : '';
      if (!prev || rDate >= prevDate) map.set(key, r);
    });
    return Array.from(map.values());
  }, [programacoes]);

  const clientGroups = useMemo(() => {
    const map = {};
    equipAtual.forEach(eq => {
      const key = eq.cliente || 'SEM CLIENTE';
      if (!map[key]) map[key] = [];
      map[key].push(eq);
    });
    return map;
  }, [equipAtual]);

  const { mapped, unmapped } = useMemo(() => {
    const m = [], u = [];
    Object.entries(clientGroups).forEach(([c, items]) => {
      if (getClientCoords(c)) m.push([c, items]);
      else u.push([c, items]);
    });
    return { mapped: m, unmapped: u };
  }, [clientGroups]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, { zoomControl: true }).setView([-22.9, -43.4], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    mapped.forEach(([cliente, items]) => {
      const coords = getClientCoords(cliente);
      if (!coords) return;

      // Predominant status
      const counts = {};
      items.forEach(eq => {
        const k = (eq.status || 'D').toUpperCase();
        counts[k] = (counts[k] || 0) + 1;
      });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'D';
      const cfg = getStatus(dominant);

      const radius = Math.min(32, Math.max(14, items.length * 2 + 12));

      const circle = L.circleMarker([coords.lat, coords.lng], {
        radius,
        fillColor: cfg.dot,
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.85,
      });

      // Popup
      const rows = items.map(eq => {
        const s = getStatus(eq.status);
        return `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9">
            <span style="width:8px;height:8px;border-radius:50%;background:${s.dot};flex-shrink:0;margin-top:4px"></span>
            <div>
              <div style="font-weight:700;font-size:12px;color:#1e293b">${eq.frota}</div>
              <div style="font-size:11px;color:#64748b">${eq.equipamento || ''}</div>
              <div style="font-size:11px;color:#94a3b8">${eq.operador || 'Sem operador'} · <span style="color:${s.color};font-weight:600">${s.label}</span></div>
            </div>
          </div>`;
      }).join('');

      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:220px;max-width:280px">
          <div style="background:#0f172a;padding:10px 14px;border-radius:12px 12px 0 0;margin:-1px -1px 0">
            <div style="font-weight:800;font-size:13px;color:white">${cliente}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">${coords.city || ''}</div>
          </div>
          <div style="padding:8px 12px;max-height:220px;overflow-y:auto">
            ${rows}
          </div>
          <div style="padding:6px 12px;background:#f8fafc;border-radius:0 0 12px 12px;font-size:11px;color:#64748b;border-top:1px solid #f1f5f9">
            ${items.length} equipamento(s) alocado(s)
          </div>
        </div>`;

      circle.bindPopup(popupHtml, { maxWidth: 300 });

      // Count label on top of circle
      const labelIcon = L.divIcon({
        className: '',
        html: `<div style="
          font-family:Inter,sans-serif;
          font-size:11px;font-weight:800;
          color:white;
          pointer-events:none;
          text-shadow:0 1px 2px rgba(0,0,0,0.4);
        ">${items.length}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const label = L.marker([coords.lat, coords.lng], { icon: labelIcon, interactive: false });

      circle.addTo(map);
      label.addTo(map);
      markersRef.current.push(circle, label);
    });
  }, [mapped]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, height: '100%' }} />

      {/* Side panel */}
      <div style={{
        width: 270,
        background: 'white',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Mapped */}
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <MapPin size={14} color="#16a34a" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
              No mapa ({mapped.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 220, overflowY: 'auto' }}>
            {mapped.map(([c, items]) => {
              const dominant = (() => {
                const cnt = {};
                items.forEach(e => { cnt[e.status] = (cnt[e.status] || 0) + 1; });
                return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || 'D';
              })();
              const cfg = getStatus(dominant);
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>{items.length}</span>
                </div>
              );
            })}
            {mapped.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Nenhum cliente mapeado.</p>
            )}
          </div>
        </div>

        {/* Unmapped */}
        {unmapped.length > 0 && (
          <div style={{ padding: '0.85rem 1rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Info size={14} color="#94a3b8" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                Sem localização ({unmapped.length})
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.6rem', lineHeight: 1.4 }}>
              Adicione em <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 4 }}>clientCoords.js</code> para exibir no mapa.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto' }}>
              {unmapped.map(([c, items]) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c || 'SEM CLIENTE'}</span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', flexShrink: 0 }}>{items.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
