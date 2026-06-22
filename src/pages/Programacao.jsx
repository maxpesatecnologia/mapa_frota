import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { useCadastros } from '../context/CadastrosContext';

const EMPTY = {
  data: '', placa: '', dia: '', equipamento: '', familia: '', frota: '',
  status: '', cliente: '', config_equipamento: '', operador: '', parte_diaria: '',
  inicio_operacao: '', intervalo: '', fim_operacao: '', total_horas: '',
  houve_quebra: false, motivo: '', item_motivo: '', horas_paradas: '',
  km_inicial: '', km_final: '', km_total: ''
};

const Programacao = () => {
  const { programacoes, saveProgramacao, deleteProgramacao, clientes, operadores, equipamentos, statusList, motivosList, itensMotivoList } = useCadastros();
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  const openNew  = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ ...EMPTY, ...p });
    setEditId(p.id);
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditId(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.data || !form.placa) return;
    setSaving(true);
    // convert types if needed
    const dataToSave = {
      ...form,
      km_inicial: form.km_inicial ? Number(form.km_inicial) : null,
      km_final: form.km_final ? Number(form.km_final) : null,
      km_total: form.km_total ? Number(form.km_total) : null,
    };
    await saveProgramacao(dataToSave, editId);
    setSaving(false);
    close();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta programação?')) return;
    await deleteProgramacao(id);
  };

  const handlePlacaChange = (e) => {
    const placaSelecionada = e.target.value;
    const eq = equipamentos.find(eq => eq.placa === placaSelecionada);
    if (eq) {
      setForm(f => ({ ...f, placa: eq.placa, equipamento: eq.equipamento || '', familia: eq.familia || '', frota: eq.frota || '' }));
    } else {
      setForm(f => ({ ...f, placa: placaSelecionada }));
    }
  };

  useEffect(() => {
    let newForm = { ...form };
    let changed = false;

    if (form.data) {
      const date = new Date(form.data);
      const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const diaCalculado = dias[date.getUTCDay()];
      if (form.dia !== diaCalculado) {
        newForm.dia = diaCalculado;
        changed = true;
      }
    }

    const timeToMins = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    if (form.inicio_operacao && form.fim_operacao) {
      let ini = timeToMins(form.inicio_operacao);
      let fim = timeToMins(form.fim_operacao);
      let int = timeToMins(form.intervalo);
      
      let diff = fim - ini;
      if (diff < 0) diff += 24 * 60;
      diff -= int;

      if (diff > 0) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        const totalCalculado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (form.total_horas !== totalCalculado) {
          newForm.total_horas = totalCalculado;
          changed = true;
        }
      } else if (form.total_horas !== '') {
        newForm.total_horas = '';
        changed = true;
      }
    }

    if (form.km_inicial && form.km_final) {
      const ini = Number(form.km_inicial);
      const fim = Number(form.km_final);
      if (!isNaN(ini) && !isNaN(fim)) {
        const tot = fim - ini;
        if (Number(form.km_total) !== tot) {
          newForm.km_total = tot;
          changed = true;
        }
      }
    }

    if (changed) {
      setForm(newForm);
    }
  }, [form.data, form.inicio_operacao, form.fim_operacao, form.intervalo, form.km_inicial, form.km_final]);

  const selectedMotivoObj = motivosList.find(m => m.nome === form.motivo);
  const filteredItensMotivo = selectedMotivoObj 
    ? itensMotivoList.filter(i => i.motivo_id === selectedMotivoObj.id)
    : [];

  const filtered = programacoes.filter(p =>
    (p.placa || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.operador || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', color: '#1e293b' }}>Programação</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
            {programacoes.length} registro(s) encontrados
          </p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: '#E30613', color: 'white', border: 'none',
          padding: '0.55rem 1.1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
        }}>
          <Plus size={16} /> Nova Programação
        </button>
      </div>

      <input
        type="text" placeholder="Buscar por placa, cliente ou operador..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 380, marginBottom: '1rem', padding: '0.55rem 0.9rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
      />

      <div style={{ flex: 1, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {[
                  'Ações', 'Data', 'Dia', 'Placa', 'Equipamento', 'Família', 'Frota', 'Status', 'Cliente',
                  'Configuração', 'Operador', 'Parte Diária', 'Início', 'Intervalo', 'Fim',
                  'Total Horas', 'Quebra?', 'Motivo', 'Item', 'Horas Paradas', 'KM Inicial', 'KM Final', 'KM Total'
                ].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={23} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                  {programacoes.length === 0 ? 'Nenhuma programação cadastrada.' : 'Nenhum resultado.'}
                </td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfd'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.85rem 1rem', position: 'sticky', left: 0, background: 'inherit' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#E30613', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.dia || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                      {p.placa || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.equipamento || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.familia || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.frota || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.status || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.cliente || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.config_equipamento || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.operador || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.parte_diaria || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.inicio_operacao || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.intervalo || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.fim_operacao || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.total_horas || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.houve_quebra ? 'Sim' : 'Não'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.motivo || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.item_motivo || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.horas_paradas || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.km_inicial || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.km_final || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.km_total || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1e293b' }}>{editId ? 'Editar Programação' : 'Nova Programação'}</h2>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                
                {/* Identificação */}
                <h3 style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>Identificação</h3>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Dia da Semana</label>
                  <input type="text" value={form.dia} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Placa *</label>
                  <select value={form.placa} onChange={handlePlacaChange} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => <option key={eq.id} value={eq.placa}>{eq.placa} - {eq.equipamento}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Equipamento</label>
                  <input type="text" value={form.equipamento} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Família</label>
                  <input type="text" value={form.familia} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Frota</label>
                  <input type="text" value={form.frota} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                    <option value="">Selecione...</option>
                    {statusList.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Cliente</label>
                  <select value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                    <option value="">Selecione...</option>
                    {clientes.map(cl => <option key={cl.id} value={cl.nome}>{cl.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Configuração</label>
                  <input type="text" value={form.config_equipamento} onChange={e => setForm(f => ({ ...f, config_equipamento: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Operador</label>
                  <select value={form.operador} onChange={e => setForm(f => ({ ...f, operador: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                    <option value="">Selecione...</option>
                    {operadores.map(op => <option key={op.id} value={op.nome}>{op.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Parte Diária</label>
                  <input type="text" value={form.parte_diaria} onChange={e => setForm(f => ({ ...f, parte_diaria: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                {/* Horários */}
                <h3 style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: '1rem' }}>Horários</h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Início Operação</label>
                  <input type="time" value={form.inicio_operacao} onChange={e => setForm(f => ({ ...f, inicio_operacao: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Intervalo</label>
                  <input type="time" value={form.intervalo} onChange={e => setForm(f => ({ ...f, intervalo: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Fim Operação</label>
                  <input type="time" value={form.fim_operacao} onChange={e => setForm(f => ({ ...f, fim_operacao: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Total Horas</label>
                  <input type="text" value={form.total_horas} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                {/* KM / Horímetro */}
                <h3 style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: '1rem' }}>KM / Horímetro</h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Inicial</label>
                  <input type="number" value={form.km_inicial} onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Final</label>
                  <input type="number" value={form.km_final} onChange={e => setForm(f => ({ ...f, km_final: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Total</label>
                  <input type="number" value={form.km_total} readOnly style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                {/* Ocorrências */}
                <h3 style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: '1rem' }}>Ocorrências (Quebra)</h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Houve Quebra?</label>
                  <select value={form.houve_quebra ? 'sim' : 'nao'} onChange={e => setForm(f => ({ ...f, houve_quebra: e.target.value === 'sim' }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Motivo</label>
                      <select value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                        <option value="">Selecione...</option>
                        {motivosList.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Item do Motivo</label>
                      <select value={form.item_motivo} onChange={e => setForm(f => ({ ...f, item_motivo: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                        <option value="">Selecione...</option>
                        {filteredItensMotivo.map(i => <option key={i.id} value={i.nome}>{i.numero ? `${i.numero} - ` : ''}{i.nome}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Horas Paradas</label>
                      <input type="time" value={form.horas_paradas} onChange={e => setForm(f => ({ ...f, horas_paradas: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
              <button onClick={close} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.data || !form.placa} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none',
                background: '#E30613', color: 'white', fontWeight: 600, fontSize: '0.875rem',
                cursor: (saving || !form.data || !form.placa) ? 'not-allowed' : 'pointer', opacity: (saving || !form.data || !form.placa) ? 0.7 : 1,
              }}>
                <Check size={15} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programacao;
