import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { useCadastros } from '../context/CadastrosContext';
import { getStatus, isWorking } from '../utils/statusConfig';
import { Truck, Wrench, TrendingUp, AlertTriangle, Clock, Upload, ArrowRight, Users } from 'lucide-react';

const COLORS = ['#E30613', '#16a34a', '#2563eb', '#d97706', '#7c3aed', '#0891b2'];

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
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
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

const Dashboard = () => {
  const { programacoes: filtered, equipamentos } = useCadastros();

  const totalClientes = useMemo(() => {
    const clients = new Set();
    filtered.forEach(r => {
      const c = String(r.cliente || '').trim();
      if (c !== '') clients.add(c);
    });
    return clients.size;
  }, [filtered]);

  const ocupacaoEquipData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = r.placa || r.frota;
      if (!k) return;
      if (!map[k]) map[k] = { placa: k, totalDias: 0, diasOperando: 0 };
      map[k].totalDias++;
      if (isWorking(r.status)) map[k].diasOperando++;
    });
    return Object.values(map)
      .map(e => ({
        placa: e.placa,
        taxa: e.totalDias > 0 ? Math.round((e.diasOperando / e.totalDias) * 100) : 0
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 15);
  }, [filtered]);

  // KPIs básicos — status mais recente por equipamento
  const { byFrota, statusCount, totalEquip, operando, taxa } = useMemo(() => {
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
    const op = uniq.filter(r => isWorking(r.status)).length;
    return {
      byFrota: uniq,
      statusCount: counts,
      totalEquip: uniq.length,
      operando: op,
      taxa: uniq.length > 0 ? Math.round((op / uniq.length) * 100) : 0,
    };
  }, [filtered]);

  // OEE por equipamento (top 10)
  const oeeData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = r.placa || r.frota;
      if (!k) return;
      if (!map[k]) map[k] = { placa: k, totalH: 0, paradasH: 0, registros: 0 };
      map[k].totalH   += timeToHours(r.total_horas);
      map[k].paradasH += timeToHours(r.horas_paradas);
      map[k].registros++;
    });
    return Object.values(map)
      .filter(e => e.totalH > 0)
      .map(e => ({
        placa: e.placa,
        oee: Math.round(((e.totalH - e.paradasH) / e.totalH) * 100),
        horas: e.totalH,
        paradas: e.paradasH,
      }))
      .sort((a, b) => b.oee - a.oee)
      .slice(0, 10);
  }, [filtered]);

  // Taxa de ocupação por família
  const familiaData = useMemo(() => {
    const map = {};
    byFrota.forEach(r => {
      if (!r.familia) return;
      if (!map[r.familia]) map[r.familia] = { total: 0, operando: 0 };
      map[r.familia].total++;
      if (isWorking(r.status)) map[r.familia].operando++;
    });
    return Object.entries(map).map(([familia, d]) => ({
      familia,
      taxa: d.total > 0 ? Math.round((d.operando / d.total) * 100) : 0,
      total: d.total,
      operando: d.operando,
    })).sort((a, b) => b.taxa - a.taxa);
  }, [byFrota]);

  // Histórico de quebras por data
  const quebraData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const date = r.data || r.iso_date;
      if (!date) return;
      const mes = String(date).slice(0, 7);
      if (!map[mes]) map[mes] = { mes, quebras: 0, horasParadas: 0 };
      if (r.houve_quebra === true || String(r.houve_quebra).toLowerCase() === 'sim') {
        map[mes].quebras++;
        map[mes].horasParadas += timeToHours(r.horas_paradas);
      }
    });
    return Object.values(map).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12);
  }, [filtered]);

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
      .slice(0, 8);
  }, [filtered]);

  // Status stacked bar data
  const stackedStatusData = useMemo(() => {
    const dataObj = { name: 'Equipamentos' };
    Object.entries(statusCount).forEach(([status, count]) => {
      dataObj[getStatus(status).label] = count;
    });
    return [dataObj];
  }, [statusCount]);

  const statusKeys = useMemo(() => {
    if (stackedStatusData.length === 0) return [];
    return Object.keys(stackedStatusData[0]).filter(k => k !== 'name');
  }, [stackedStatusData]);

  const totalQuebras  = filtered.filter(r => r.houve_quebra === true || String(r.houve_quebra).toLowerCase() === 'sim').length;
  const totalParadas  = filtered.reduce((s, r) => s + timeToHours(r.horas_paradas), 0);

  const familiaCount = useMemo(() => {
    const map = {};
    equipamentos.forEach(e => {
      const f = e.familia || 'Sem família';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [equipamentos]);

  if (filtered.length === 0) {
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
      <h1 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '1.25rem' }}>Dashboard</h1>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard icon={<Truck size={20} color="#64748b" />}      label="Total de Equipamentos" value={totalEquip} color="#64748b" />
        <KpiCard icon={<Users size={20} color="#0891b2" />}      label="Clientes Atendidos"     value={totalClientes} color="#0891b2" />
        <KpiCard icon={<TrendingUp size={20} color="#16a34a" />} label="Operando"               value={operando}   color="#16a34a" sub={`${taxa}% de ocupação`} />
        <KpiCard icon={<AlertTriangle size={20} color="#E30613"/>}label="Quebras (período)"     value={totalQuebras} color="#E30613" />
        <KpiCard icon={<Clock size={20} color="#d97706" />}      label="Horas Paradas (total)"  value={`${totalParadas.toFixed(0)}h`} color="#d97706" />
        <KpiCard icon={<Wrench size={20} color="#7c3aed" />}     label="OEE Médio"
          value={oeeData.length > 0 ? `${Math.round(oeeData.reduce((s,e)=>s+e.oee,0)/oeeData.length)}%` : '—'}
          color="#7c3aed"
        />
      </div>

      {/* Row 1: Status pie + Ocupação por família */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card title="Equipamentos por Status">
          {statusKeys.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stackedStatusData} layout="vertical" margin={{ left: 0, right: 10, top: 40, bottom: 40 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                {statusKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} barSize={60} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>

        <Card title="Taxa de Ocupação por Família (%)">
          {familiaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={familiaData} margin={{ left: -10 }}>
                <XAxis dataKey="familia" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="taxa" fill="#E30613" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>
      </div>

      {/* Row 2: OEE + Quebras */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card title="OEE por Equipamento (%)">
          {oeeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={oeeData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="placa" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="oee" radius={[0, 4, 4, 0]}
                  fill="#7c3aed"
                  label={{ position: 'right', fontSize: 10, formatter: (v) => `${v}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Importe dados com horas para calcular OEE</p>}
        </Card>

        <Card title="Histórico de Quebras por Mês">
          {quebraData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={quebraData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="quebras" stroke="#E30613" strokeWidth={2} dot={{ r: 4 }} name="Quebras" />
                <Line type="monotone" dataKey="horasParadas" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} name="Horas Paradas" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem quebras registradas</p>}
        </Card>
      </div>

      {/* Row 3: Horas paradas por cliente + Ocupação por Equipamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card title="Horas Paradas por Cliente">
          {clienteParadasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clienteParadasData} margin={{ left: -10 }}>
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip formatter={(v) => `${v}h`} />
                <Bar dataKey="horasParadas" fill="#d97706" radius={[4, 4, 0, 0]} name="Horas Paradas" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem horas paradas registradas</p>}
        </Card>

        <Card title="Taxa de Ocupação por Equipamento (%)">
          {ocupacaoEquipData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ocupacaoEquipData} margin={{ left: -10 }}>
                <XAxis dataKey="placa" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="taxa" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ocupação" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sem dados</p>}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
