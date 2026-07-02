import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from 'recharts';
import { useCadastros } from '../context/CadastrosContext';
import { getStatus, getStatusGroup } from '../utils/statusConfig';
import { Truck, Wrench, TrendingUp, AlertTriangle, Clock, Users } from 'lucide-react';

const KpiCard = ({ icon, label, value, sub, color = '#E30613' }) => (
  <div style={{
    background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    borderTop: `3px solid ${color}`,
    display: 'flex', alignItems: 'center', gap: '1rem',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: String(value).length > 6 ? '1.1rem' : '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);


const Card = ({ title, children, style }) => (
  <div style={{
    background: 'white', borderRadius: 12, padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)', ...style,
  }}>
    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
      {title}
    </h3>
    {children}
  </div>
);

const timeToHours = (t) => {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  const parts = String(t).split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h + (m / 60);
};

const formatTime = (decimalHours) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const Dashboard = () => {
  const { programacoes, equipamentos } = useCadastros();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const filtered = useMemo(() => {
    return programacoes.filter(r => {
      const d = r.data || r.iso_date;
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      return true;
    });
  }, [programacoes, dataInicio, dataFim]);

  const totalClientes = useMemo(() => {
    const clients = new Set();
    filtered.forEach(r => {
      const c = String(r.cliente || '').trim();
      if (c && getStatusGroup(r.status) !== null) clients.add(c);
    });
    return clients.size;
  }, [filtered]);

  const ocupacaoEquipData = useMemo(() => {
    const map = {};
    equipamentos.forEach(e => {
      const k = e.placa || e.frota;
      if (k) map[k] = { placa: k, diasTrabalhados: new Set(), diasComRegistro: new Set() };
    });

    filtered.forEach(r => {
      const k = r.placa || r.frota;
      if (!k) return;
      if (!map[k]) map[k] = { placa: k, diasTrabalhados: new Set(), diasComRegistro: new Set() };

      const date = r.data || r.iso_date;
      if (date) {
        map[k].diasComRegistro.add(date);
        if (getStatusGroup(r.status) !== null) {
          map[k].diasTrabalhados.add(date);
        }
      }
    });
    return Object.values(map)
      .map(e => {
        const dTrab = e.diasTrabalhados.size;
        const dUteis = e.diasComRegistro.size;
        const taxa = dUteis > 0 ? Number(((dTrab / dUteis) * 100).toFixed(1)) : 0;
        return {
          placa: e.placa,
          diasTrabalhados: dTrab,
          diasComRegistro: dUteis,
          taxa,
          label: `${taxa}%`
        };
      })
      .sort((a, b) => b.taxa - a.taxa);
  }, [filtered, equipamentos]);

  // KPIs básicos — status mais recente por equipamento
  const { totalEquip } = useMemo(() => {
    const map = new Map();
    filtered.forEach(r => {
      const k = r.placa || r.frota;
      const prev = map.get(k);
      const rDate = r.data || r.iso_date;
      const prevDate = prev ? (prev.data || prev.iso_date) : null;
      if (!prev || rDate >= prevDate) map.set(k, r);
    });
    const uniq = Array.from(map.values());
    const counts = {};
    uniq.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const op = uniq.filter(r => getStatusGroup(r.status) !== null).length;
    return {
      byFrota: uniq,
      statusCount: counts,
      totalEquip: uniq.length,
      operando: op,
      taxa: uniq.length > 0 ? Math.round((op / uniq.length) * 100) : 0,
    };
  }, [filtered]);

  const globalOcupacao = useMemo(() => {
    const ativos = ocupacaoEquipData.filter(e => e.diasTrabalhados > 0);
    if (ativos.length === 0) return 0;
    const soma = ativos.reduce((s, e) => s + e.taxa, 0);
    return Math.round(soma / ativos.length);
  }, [ocupacaoEquipData]);

  const familiaData = useMemo(() => {
    // Agrupa as taxas individuais de cada equipamento por família e tira a média
    const map = {};
    equipamentos.forEach(e => {
      const familia = e.familia || 'Sem família';
      if (!map[familia]) map[familia] = [];
    });
    ocupacaoEquipData.forEach(equip => {
      const eq = equipamentos.find(e => (e.placa || e.frota) === equip.placa);
      const familia = eq?.familia;
      if (!familia) return;
      if (!map[familia]) map[familia] = [];
      map[familia].push(equip.taxa);
    });
    return Object.entries(map)
      .filter(([, taxas]) => taxas.length > 0)
      .map(([familia, taxas]) => {
        const media = Number((taxas.reduce((s, t) => s + t, 0) / taxas.length).toFixed(1));
        return { familia, taxa: media, label: `${media}%` };
      })
      .sort((a, b) => b.taxa - a.taxa);
  }, [ocupacaoEquipData, equipamentos]);


  // Horas paradas por cliente
  const clienteParadasData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      if (!r.cliente) return;
      if (!map[r.cliente]) map[r.cliente] = { cliente: r.cliente, horasParadas: 0, registros: 0 };
      map[r.cliente].horasParadas += timeToHours(r.horas_paradas);
      map[r.cliente].registros++;
    });
    return Object.values(map)
      .filter(c => c.horasParadas > 0)
      .sort((a, b) => b.horasParadas - a.horasParadas)
      .map(c => ({
        ...c,
        labelStr: formatTime(c.horasParadas)
      }))
      .slice(0, 8);
  }, [filtered]);

  // Status bar data - somando todos os dias no período
  const statusData = useMemo(() => {
    const counts = {};
    filtered.forEach(r => {
      const st = r.status || 'Sem Status';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totalQuebras  = filtered.filter(r => r.houve_quebra === true || String(r.houve_quebra).toLowerCase() === 'sim').length;
  
  const totalHorasOperacionais = filtered.reduce((s, r) => {
    return getStatusGroup(r.status) !== null ? s + timeToHours(r.total_horas) : s;
  }, 0);

  const familiaCount = useMemo(() => {
    const map = {};
    equipamentos.forEach(e => {
      const f = e.familia || 'Sem família';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [equipamentos]);

  if (filtered.length === 0 && programacoes.length === 0) {
    return (
      <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <h1 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Sem dados operacionais ainda. Importe uma planilha para ver as métricas de frota.
        </p>

        {/* Catálogo de equipamentos */}
        {equipamentos.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #E30613', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E3061318', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={20} color="#E30613" />
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{equipamentos.length}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Equipamentos cadastrados</div>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #7c3aed', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wrench size={20} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{familiaCount.length}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Famílias de equipamentos</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', marginBottom: '1.5rem', maxWidth: 560 }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                Equipamentos por Família
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {familiaCount.map(([familia, count]) => (
                  <div key={familia} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#374151', minWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{familia}</span>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((count / equipamentos.length) * 100)}%`, background: '#E30613', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}


      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', padding: '0.4rem 0.6rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
           <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#333' }} />
           <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>até</span>
           <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#333' }} />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard icon={<Truck size={20} color="#64748b" />}      label="Total de Equipamentos" value={totalEquip} color="#64748b" />
        <KpiCard icon={<Users size={20} color="#0891b2" />} label="Clientes Atendidos" value={totalClientes} color="#0891b2" />
        <KpiCard icon={<TrendingUp size={20} color="#16a34a" />} label="Taxa de Ocupação"        value={`${globalOcupacao}%`} color="#16a34a" />
        <KpiCard icon={<AlertTriangle size={20} color="#E30613"/>}label="Quebras (período)"     value={totalQuebras} color="#E30613" />
        <KpiCard icon={<Clock size={20} color="#2563eb" />}      label="Horas (Operacionais)"   value={formatTime(totalHorasOperacionais)} color="#2563eb" />
      </div>

      {/* Row 1: Status pie + Ocupação por família */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card title="Total de Dias por Status (No Período)">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} axisLine={false} tickLine={false} interval={0} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatus(entry.name).color} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#333' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>

        <Card title="Taxa de Ocupação por Família (%)">
          {familiaData.length > 0 ? (
            <div style={{ width: '100%', height: 260, overflowY: 'auto', overflowX: 'hidden', paddingRight: 5 }}>
              <ResponsiveContainer width="100%" height={Math.max(240, familiaData.length * 45)}>
                <BarChart data={familiaData} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="familia" tick={{ fontSize: 11 }} width={150} interval={0} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="taxa" fill="#eab308" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="label" position="right" style={{ fontSize: 11, fontWeight: 600, fill: '#333' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>
      </div>

{/* Row 3: Horas paradas por cliente + Ocupação por Equipamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card title="Horas Paradas por Cliente">
          {clienteParadasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clienteParadasData} margin={{ left: -10, top: 20 }}>
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTime} />
                <Tooltip formatter={(v) => formatTime(v)} />
                <Bar dataKey="horasParadas" fill="#d97706" radius={[4, 4, 0, 0]} name="Horas Paradas">
                  <LabelList dataKey="labelStr" position="top" style={{ fontSize: 10, fill: '#333' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem horas paradas registradas</p>}
        </Card>

        <Card title="Taxa de Ocupação por Equipamento (%)">
          {ocupacaoEquipData.length > 0 ? (
            <div style={{ width: '100%', height: 260, overflowY: 'auto', overflowX: 'hidden', paddingRight: 5 }}>
              <ResponsiveContainer width="100%" height={Math.max(240, ocupacaoEquipData.length * 40)}>
                <BarChart data={ocupacaoEquipData} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="placa" tick={{ fontSize: 11 }} width={100} interval={0} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="taxa" fill="#eab308" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="label" position="right" style={{ fontSize: 11, fontWeight: 600, fill: '#333' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
