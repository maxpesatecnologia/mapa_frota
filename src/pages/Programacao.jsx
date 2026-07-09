import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check, Upload, FileText, FileImage, File, Download, MessageSquare, Paperclip, Loader, Filter, Search } from 'lucide-react';
import { useCadastros } from '../context/CadastrosContext';

const EMPTY = {
  data: '', placa: '', dia: '', equipamento: '', familia: '', frota: '',
  status: '', cliente: '', config_equipamento: '', operador: '', auxiliar: '', parte_diaria: '',
  inicio_operacao: '', intervalo: '', fim_operacao: '', total_horas: '',
  houve_quebra: false, motivo: '', item_motivo: '', horas_paradas: '',
  km_inicial: '', km_final: '', km_total: '',
  horimetro_inicial: '', horimetro_final: '', horimetro_total: '',
  anotacao: ''
};

const TABLE_HEADERS = [
  'Ações', 'Anexos', 'Anot.', 'Data', 'Dia', 'Placa', 'Equipamento', 'Família', 'Frota', 'Status', 'Cliente',
  'Configuração', 'Operador', 'Auxiliar', 'Parte Diária', 'Início', 'Intervalo', 'Fim',
  'Total Horas', 'Quebra?', 'Motivo', 'Item', 'Horas Paradas',
  'KM Inicial', 'KM Final', 'KM Total',
  'Horímetro Inicial', 'Horímetro Final', 'Horímetro Total'
];

const TIPOS_ACEITOS = '.jpg,.jpeg,.png,.pdf,.doc,.docx';
const MAX_MB = 10;

const iconeArquivo = (tipo) => {
  if (!tipo) return <File size={16} />;
  if (['jpg','jpeg','png','gif','webp'].includes(tipo)) return <FileImage size={16} color="#10b981" />;
  if (tipo === 'pdf') return <FileText size={16} color="#E30613" />;
  if (['doc','docx'].includes(tipo)) return <FileText size={16} color="#2563eb" />;
  return <File size={16} color="#64748b" />;
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Programacao = () => {
  const {
    programacoes, saveProgramacao, deleteProgramacao,
    clientes, operadores, equipamentos, statusList, motivosList, itensMotivoList,
    anexosByProg, loadAnexos, loadAnexosBulk, uploadAnexo, deleteAnexo, getAnexoUrl
  } = useCadastros();

  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [search,           setSearch]           = useState('');
  const [filterStatus,     setFilterStatus]     = useState('all');
  const [filterFamilia,    setFilterFamilia]    = useState('all');
  const [filterCliente,    setFilterCliente]    = useState('all');
  const [filterFrota,      setFilterFrota]      = useState('all');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim,    setFilterDataFim]    = useState('');
  const [showFilters,      setShowFilters]      = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [currentProgId, setCurrentProgId] = useState(null);
  const [viewingRow, setViewingRow] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null); // { id, value }
  const inlineEditRef = useRef(null);
  const fileInputRef = useRef(null);

  const startInlineEdit = (p) => {
    const state = { id: p.id, value: p.parte_diaria || '' };
    inlineEditRef.current = state;
    setInlineEdit(state);
  };

  const commitInlineEdit = async () => {
    const current = inlineEditRef.current;
    if (!current) return;
    inlineEditRef.current = null;
    setInlineEdit(null);
    await saveProgramacao({ parte_diaria: current.value }, current.id);
  };

  const openNew = () => {
    setForm(EMPTY);
    setEditId(null);
    setCurrentProgId(null);
    setShowForm(true);
    setUploadErr('');
  };

  const openEdit = async (p) => {
    setForm({ ...EMPTY, ...p });
    setEditId(p.id);
    setCurrentProgId(p.id);
    setShowForm(true);
    setUploadErr('');
    await loadAnexos(p.id);
  };

  const close = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    setCurrentProgId(null);
    setUploadErr('');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!form.data || !form.placa) return;
    setSaving(true);
    setSaveError('');
    const dataToSave = {
      ...form,
      km_inicial: form.km_inicial ? Number(form.km_inicial) : null,
      km_final:   form.km_final   ? Number(form.km_final)   : null,
      km_total:   form.km_total   ? Number(form.km_total)   : null,
      horimetro_inicial: form.horimetro_inicial ? Number(form.horimetro_inicial) : null,
      horimetro_final:   form.horimetro_final   ? Number(form.horimetro_final)   : null,
      horimetro_total:   form.horimetro_total   ? Number(form.horimetro_total)   : null,
    };
    const resultado = await saveProgramacao(dataToSave, editId);
    setSaving(false);
    if (!resultado && !editId) {
      setSaveError('Erro ao salvar. Verifique se todas as colunas existem no banco de dados.');
      return;
    }
    if (!editId && resultado && resultado.id) {
      setCurrentProgId(resultado.id);
      setEditId(resultado.id);
    }
    close();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta programação e todos os seus anexos?')) return;
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
      if (form.dia !== diaCalculado) { newForm.dia = diaCalculado; changed = true; }
    }

    const timeToMins = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    if (form.inicio_operacao && form.fim_operacao) {
      let diff = timeToMins(form.fim_operacao) - timeToMins(form.inicio_operacao);
      if (diff < 0) diff += 24 * 60;
      diff -= timeToMins(form.intervalo);
      if (diff > 0) {
        const totalCalculado = `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
        if (form.total_horas !== totalCalculado) { newForm.total_horas = totalCalculado; changed = true; }
      } else if (form.total_horas !== '') { newForm.total_horas = ''; changed = true; }
    }

    if (form.km_inicial && form.km_final) {
      const tot = Number(form.km_final) - Number(form.km_inicial);
      if (!isNaN(tot) && Number(form.km_total) !== tot) { newForm.km_total = tot; changed = true; }
    }

    if (form.horimetro_inicial && form.horimetro_final) {
      const tot = Number(form.horimetro_final) - Number(form.horimetro_inicial);
      if (!isNaN(tot) && Number(form.horimetro_total) !== tot) { newForm.horimetro_total = tot; changed = true; }
    }

    if (changed) setForm(newForm);
  }, [form.data, form.inicio_operacao, form.fim_operacao, form.intervalo, form.km_inicial, form.km_final, form.horimetro_inicial, form.horimetro_final]);

  // ── UPLOAD DE ARQUIVOS ──────────────────────────────────────────────
  const processarArquivos = useCallback(async (files) => {
    if (!currentProgId) {
      setUploadErr('⚠️ Salve o registro antes de anexar arquivos.');
      return;
    }
    setUploadErr('');
    const lista = Array.from(files);
    for (const file of lista) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg','jpeg','png','pdf','doc','docx'].includes(ext)) {
        setUploadErr(`Tipo não permitido: .${ext}. Use JPG, PNG, PDF, DOC ou DOCX.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setUploadErr(`Arquivo muito grande (máx ${MAX_MB}MB): ${file.name}`);
        continue;
      }
      setUploading(true);
      try {
        await uploadAnexo(file, currentProgId);
      } catch (e) {
        setUploadErr(`Erro ao enviar ${file.name}: ${e.message}`);
      }
      setUploading(false);
    }
  }, [currentProgId, uploadAnexo]);

  const onDropZone = (e) => {
    e.preventDefault();
    setDragOver(false);
    processarArquivos(e.dataTransfer.files);
  };

  const anexosAtuais = currentProgId ? (anexosByProg[currentProgId] || []) : [];

  const selectedMotivoObj = motivosList.find(m => m.nome === form.motivo);
  const filteredItensMotivo = selectedMotivoObj
    ? itensMotivoList.filter(i => i.motivo_id === selectedMotivoObj.id)
    : [];

  const [displayCount, setDisplayCount] = useState(100);

  /* opções únicas para os dropdowns */
  const { statuses, familias, clientesOpts, frotasOpts } = useMemo(() => {
    const st = new Set(), fa = new Set(), cl = new Set(), fr = new Set();
    programacoes.forEach(r => {
      if (r.status)  st.add(r.status);
      if (r.familia) fa.add(r.familia);
      if (r.cliente) cl.add(r.cliente);
      if (r.frota)   fr.add(r.frota);
    });
    return { statuses: [...st].sort(), familias: [...fa].sort(), clientesOpts: [...cl].sort(), frotasOpts: [...fr].sort() };
  }, [programacoes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return programacoes.filter(r => {
      if (filterStatus     !== 'all' && r.status  !== filterStatus)  return false;
      if (filterFamilia    !== 'all' && r.familia !== filterFamilia) return false;
      if (filterCliente    !== 'all' && r.cliente !== filterCliente) return false;
      if (filterFrota      !== 'all' && r.frota   !== filterFrota)   return false;
      if (filterDataInicio && String(r.data || '').slice(0, 10) < filterDataInicio) return false;
      if (filterDataFim    && String(r.data || '').slice(0, 10) > filterDataFim)    return false;
      if (q) {
        const hay = [r.placa, r.frota, r.equipamento, r.operador, r.cliente, r.familia].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programacoes, search, filterStatus, filterFamilia, filterCliente, filterFrota, filterDataInicio, filterDataFim]);

  const displayed = useMemo(() => filtered.slice(0, displayCount), [filtered, displayCount]);

  const displayedIdsKey = displayed.map(p => p.id).join(',');
  useEffect(() => {
    if (displayed.length > 0) loadAnexosBulk(displayed.map(p => p.id));
  }, [displayedIdsKey]);

  const hasFilters = search || filterStatus !== 'all' || filterFamilia !== 'all' || filterCliente !== 'all' || filterFrota !== 'all' || filterDataInicio || filterDataFim;

  const clearFilters = () => {
    setSearch(''); setFilterStatus('all');
    setFilterFamilia('all'); setFilterCliente('all');
    setFilterFrota('all');
    setFilterDataInicio(''); setFilterDataFim('');
  };

  // Reseta a paginação ao filtrar
  useEffect(() => {
    setDisplayCount(100);
  }, [search, filterStatus, filterFamilia, filterCliente, filterFrota, filterDataInicio, filterDataFim]);

  // ── ESTILOS REUTILIZÁVEIS ───────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box'
  };
  const labelStyle = {
    display: 'block', fontSize: '0.78rem', fontWeight: 600,
    color: '#475569', marginBottom: '0.35rem'
  };
  const sectionTitleStyle = {
    gridColumn: '1 / -1', fontSize: '0.9rem', color: '#334155',
    borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: '1rem'
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* ── Cabeçalho ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', color: '#1e293b' }}>Programação</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
            {programacoes.length} registro(s) encontrados
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              <span style={{ background: '#E30613', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
            )}
          </button>
          <button onClick={openNew} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#E30613', color: 'white', border: 'none',
            padding: '0.55rem 1.1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <Plus size={16} /> Nova Programação
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
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
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar placa, frota, operador..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#1e293b', outline: 'none' }}
            />
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
            <option value="all">Todos os status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterFamilia} onChange={e => setFilterFamilia(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
            <option value="all">Todas as famílias</option>
            {familias.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
            <option value="all">Todos os clientes</option>
            {clientesOpts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterFrota} onChange={e => setFilterFrota(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
            <option value="all">Todas as frotas</option>
            {frotasOpts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>De</label>
            <input type="date" value={filterDataInicio} onChange={e => setFilterDataInicio(e.target.value)} max={filterDataFim || undefined}
              style={{ padding: '0.43rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Até</label>
            <input type="date" value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)} min={filterDataInicio || undefined}
              style={{ padding: '0.43rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.8rem', color: '#374151', background: 'white', cursor: 'pointer', outline: 'none' }} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.75rem', border: '1px solid #fca5a5', borderRadius: 7, background: '#fff7f7', color: '#E30613', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={{ flex: 1, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {TABLE_HEADERS.map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={TABLE_HEADERS.length} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                  {programacoes.length === 0 ? 'Nenhuma programação cadastrada.' : 'Nenhum resultado.'}
                </td></tr>
              ) : displayed.map((p, i) => {
                const qtdAnexos = (anexosByProg[p.id] || []).length;
                return (
                  <tr key={p.id} style={{ borderBottom: i < displayed.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfd'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '0.85rem 1rem', position: 'sticky', left: 0, background: 'inherit' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#E30613', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                    {/* Badge Anexos */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      {qtdAnexos > 0 ? (
                        <button
                          onClick={() => setViewingRow(p)}
                          title="Ver anexos"
                          style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#eff6ff', color:'#2563eb', borderRadius:99, padding:'2px 8px', fontSize:'0.75rem', fontWeight:600, border:'none', cursor:'pointer' }}
                        >
                          <Paperclip size={11} />{qtdAnexos}
                        </button>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>}
                    </td>
                    {/* Ícone Anotação */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      {p.anotacao ? (
                        <span title={p.anotacao} style={{ color: '#f59e0b' }}><MessageSquare size={15} /></span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.dia || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{p.placa || '—'}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.equipamento || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.familia || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.frota || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.status || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.cliente || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.config_equipamento || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.operador || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.auxiliar || '—'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}>
                      {inlineEdit?.id === p.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={inlineEdit.value}
                          onChange={e => { const v = e.target.value; inlineEditRef.current = { ...inlineEditRef.current, value: v }; setInlineEdit(prev => ({ ...prev, value: v })); }}
                          onBlur={commitInlineEdit}
                          onKeyDown={e => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                          style={{ width: 100, fontSize: '0.85rem', padding: '2px 6px', border: '1.5px solid #2563eb', borderRadius: 5, outline: 'none' }}
                        />
                      ) : (
                        <span
                          onClick={() => startInlineEdit(p)}
                          title="Clique para editar"
                          style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: 5, color: '#475569', display: 'inline-block', minWidth: 40, borderBottom: '1px dashed #cbd5e1' }}
                        >
                          {p.parte_diaria || '—'}
                        </span>
                      )}
                    </td>
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
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.horimetro_inicial || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.horimetro_final || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>{p.horimetro_total || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Botão Carregar Mais */}
        {filtered.length > displayed.length && (
          <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button 
              onClick={() => setDisplayCount(c => c + 100)}
              style={{
                padding: '0.55rem 1.5rem', borderRadius: 8, border: '1px solid #cbd5e1',
                background: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Mostrar mais ({displayed.length} de {filtered.length})
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Formulário ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 1050, maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {/* Header do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>{editId ? 'Editar Programação' : 'Nova Programação'}</h2>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                {/* ── Identificação ── */}
                <h3 style={sectionTitleStyle}>Identificação</h3>

                <div>
                  <label style={labelStyle}>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Dia da Semana</label>
                  <input type="text" value={form.dia} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={labelStyle}>Placa *</label>
                  <select value={form.placa} onChange={handlePlacaChange} style={inputStyle}>
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => <option key={eq.id} value={eq.placa}>{eq.placa} - {eq.equipamento}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Equipamento</label>
                  <input type="text" value={form.equipamento} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={labelStyle}>Família</label>
                  <input type="text" value={form.familia} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={labelStyle}>Frota</label>
                  <input type="text" value={form.frota} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                    <option value="">Selecione...</option>
                    {statusList.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cliente</label>
                  <input type="text" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Digite o nome do cliente..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Configuração</label>
                  <input type="text" value={form.config_equipamento} onChange={e => setForm(f => ({ ...f, config_equipamento: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Operador(es)</label>
                  {form.operador && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {form.operador.split(',').map(o => o.trim()).filter(Boolean).map(op => (
                        <span key={op} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#eff6ff', color: '#2563eb',
                          borderRadius: 99, padding: '3px 10px',
                          fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          {op}
                          <button type="button" onClick={() => {
                            const arr = form.operador.split(',').map(o => o.trim()).filter(o => o && o !== op);
                            setForm(f => ({ ...f, operador: arr.join(', ') }));
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, lineHeight: 1, display: 'flex' }}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <select value="" onChange={e => {
                    const val = e.target.value;
                    if (!val) return;
                    const arr = form.operador ? form.operador.split(',').map(o => o.trim()).filter(Boolean) : [];
                    if (!arr.includes(val)) setForm(f => ({ ...f, operador: [...arr, val].join(', ') }));
                  }} style={inputStyle}>
                    <option value="">Adicionar operador...</option>
                    {operadores.filter(op => !(form.operador || '').split(',').map(o => o.trim()).includes(op.nome))
                      .map(op => <option key={op.id} value={op.nome}>{op.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Auxiliar(es)</label>
                  {form.auxiliar && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {form.auxiliar.split(',').map(o => o.trim()).filter(Boolean).map(ax => (
                        <span key={ax} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#f0fdf4', color: '#16a34a',
                          borderRadius: 99, padding: '3px 10px',
                          fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          {ax}
                          <button type="button" onClick={() => {
                            const arr = form.auxiliar.split(',').map(o => o.trim()).filter(o => o && o !== ax);
                            setForm(f => ({ ...f, auxiliar: arr.join(', ') }));
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 0, lineHeight: 1, display: 'flex' }}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <select value="" onChange={e => {
                    const val = e.target.value;
                    if (!val) return;
                    const arr = form.auxiliar ? form.auxiliar.split(',').map(o => o.trim()).filter(Boolean) : [];
                    if (!arr.includes(val)) setForm(f => ({ ...f, auxiliar: [...arr, val].join(', ') }));
                  }} style={inputStyle}>
                    <option value="">Adicionar auxiliar...</option>
                    {operadores.filter(op => !(form.auxiliar || '').split(',').map(o => o.trim()).includes(op.nome))
                      .map(op => <option key={op.id} value={op.nome}>{op.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parte Diária</label>
                  <input type="text" value={form.parte_diaria} onChange={e => setForm(f => ({ ...f, parte_diaria: e.target.value }))} style={inputStyle} />
                </div>

                {/* ── Horários ── */}
                <h3 style={sectionTitleStyle}>Horários</h3>
                <div>
                  <label style={labelStyle}>Início Operação</label>
                  <input type="time" value={form.inicio_operacao} onChange={e => setForm(f => ({ ...f, inicio_operacao: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Intervalo</label>
                  <input type="time" value={form.intervalo} onChange={e => setForm(f => ({ ...f, intervalo: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fim Operação</label>
                  <input type="time" value={form.fim_operacao} onChange={e => setForm(f => ({ ...f, fim_operacao: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Total Horas</label>
                  <input type="text" value={form.total_horas} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>

                {/* ── KM ── */}
                <h3 style={sectionTitleStyle}>KM</h3>
                <div>
                  <label style={labelStyle}>KM Inicial</label>
                  <input type="number" value={form.km_inicial} onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>KM Final</label>
                  <input type="number" value={form.km_final} onChange={e => setForm(f => ({ ...f, km_final: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>KM Total</label>
                  <input type="number" value={form.km_total} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>

                {/* ── Horímetro ── */}
                <h3 style={sectionTitleStyle}>Horímetro</h3>
                <div>
                  <label style={labelStyle}>Horímetro Inicial</label>
                  <input type="number" value={form.horimetro_inicial} onChange={e => setForm(f => ({ ...f, horimetro_inicial: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Horímetro Final</label>
                  <input type="number" value={form.horimetro_final} onChange={e => setForm(f => ({ ...f, horimetro_final: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Horímetro Total</label>
                  <input type="number" value={form.horimetro_total} readOnly style={{ ...inputStyle, background: '#f8fafc' }} />
                </div>

                {/* ── Ocorrências ── */}
                <h3 style={sectionTitleStyle}>Ocorrências (Quebra)</h3>
                <div>
                  <label style={labelStyle}>Houve Quebra?</label>
                  <select value={form.houve_quebra ? 'sim' : 'nao'} onChange={e => setForm(f => ({ ...f, houve_quebra: e.target.value === 'sim' }))} style={inputStyle}>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Motivo</label>
                  <select value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={inputStyle}>
                    <option value="">Selecione...</option>
                    {motivosList.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Item do Motivo</label>
                  <select value={form.item_motivo} onChange={e => setForm(f => ({ ...f, item_motivo: e.target.value }))} style={inputStyle}>
                    <option value="">Selecione...</option>
                    {filteredItensMotivo.map(i => <option key={i.id} value={i.nome}>{i.numero ? `${i.numero} - ` : ''}{i.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Horas Paradas</label>
                  <input type="time" value={form.horas_paradas} onChange={e => setForm(f => ({ ...f, horas_paradas: e.target.value }))} style={inputStyle} />
                </div>

                {/* ════════════════════════════════════════
                    ANOTAÇÕES
                ════════════════════════════════════════ */}
                <h3 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={16} color="#f59e0b" /> Anotações
                </h3>
                <div style={{ gridColumn: '1 / -1' }}>
                  <textarea
                    value={form.anotacao}
                    onChange={e => setForm(f => ({ ...f, anotacao: e.target.value }))}
                    placeholder="Adicione observações, notas ou informações relevantes sobre esta programação..."
                    rows={4}
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                      border: '1px solid #e2e8f0', fontSize: '0.875rem',
                      boxSizing: 'border-box', resize: 'vertical',
                      fontFamily: 'inherit', color: '#1e293b', lineHeight: 1.6,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#E30613'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    {(form.anotacao || '').length} caracteres
                  </p>
                </div>

                {/* ════════════════════════════════════════
                    ANEXOS
                ════════════════════════════════════════ */}
                <h3 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={16} color="#2563eb" /> Anexos
                  {anexosAtuais.length > 0 && (
                    <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 99, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {anexosAtuais.length}
                    </span>
                  )}
                </h3>

                <div style={{ gridColumn: '1 / -1' }}>
                  {!editId && (
                    <div style={{
                      background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8,
                      padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#92400e',
                      marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      ⚠️ Salve o registro primeiro para habilitar o upload de anexos.
                    </div>
                  )}

                  {/* Área de Drop */}
                  {editId && (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDropZone}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? '#E30613' : '#cbd5e1'}`,
                        borderRadius: 10, padding: '1.5rem',
                        textAlign: 'center', cursor: 'pointer',
                        background: dragOver ? '#fff5f5' : '#f8fafc',
                        transition: 'all 0.2s', marginBottom: '0.75rem',
                      }}
                    >
                      <input
                        ref={fileInputRef} type="file" multiple
                        accept={TIPOS_ACEITOS} style={{ display: 'none' }}
                        onChange={e => processarArquivos(e.target.files)}
                      />
                      {uploading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748b' }}>
                          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '0.875rem' }}>Enviando arquivo...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} color={dragOver ? '#E30613' : '#94a3b8'} style={{ marginBottom: 8 }} />
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                            Arraste arquivos aqui ou <span style={{ color: '#E30613', fontWeight: 700 }}>clique para selecionar</span>
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                            JPG, PNG, PDF, DOC, DOCX — máx. {MAX_MB}MB por arquivo
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Erro de upload */}
                  {uploadErr && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.75rem' }}>
                      {uploadErr}
                    </div>
                  )}

                  {/* Lista de Anexos */}
                  {anexosAtuais.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {anexosAtuais.map(anx => {
                        const url = getAnexoUrl(anx.storage_path);
                        const isImagem = ['jpg','jpeg','png','gif','webp'].includes(anx.tipo_arquivo || '');
                        return (
                          <div key={anx.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 0.85rem', borderRadius: 8,
                            border: '1px solid #e2e8f0', background: 'white'
                          }}>
                            {/* Preview ou Ícone */}
                            {isImagem ? (
                              <img
                                src={url} alt={anx.nome_arquivo}
                                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #e2e8f0' }}
                              />
                            ) : (
                              <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {iconeArquivo(anx.tipo_arquivo)}
                              </div>
                            )}

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {anx.nome_arquivo}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                                {(anx.tipo_arquivo || '').toUpperCase()} · {formatBytes(anx.tamanho_bytes)}
                              </p>
                            </div>

                            {/* Ações */}
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '0.3rem', borderRadius: 6, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                              title="Abrir/Baixar"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir o arquivo "${anx.nome_arquivo}"?`)) deleteAnexo(anx);
                              }}
                              style={{ padding: '0.3rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#E30613', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Excluir anexo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {editId && anexosAtuais.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '0.5rem 0' }}>
                      Nenhum anexo adicionado ainda.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Footer do Modal */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
              <button onClick={close} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancelar
              </button>
              {saveError && (
                <span style={{ fontSize: '0.78rem', color: '#E30613', fontWeight: 600 }}>{saveError}</span>
              )}
              <button onClick={handleSave} disabled={saving || !form.data || !form.placa} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none',
                background: '#E30613', color: 'white', fontWeight: 600, fontSize: '0.875rem',
                cursor: (saving || !form.data || !form.placa) ? 'not-allowed' : 'pointer',
                opacity: (saving || !form.data || !form.placa) ? 0.7 : 1,
              }}>
                <Check size={15} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL DE VISUALIZAÇÃO DE ANEXOS
      ════════════════════════════════════════ */}
      {viewingRow && (
        <div
          onClick={() => setViewingRow(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={16} color="#2563eb" /> Anexos — {viewingRow.placa || viewingRow.equipamento || '—'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                  {viewingRow.data ? new Date(viewingRow.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
                </p>
              </div>
              <button onClick={() => setViewingRow(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(anexosByProg[viewingRow.id] || []).map(anx => {
                const url = getAnexoUrl(anx.storage_path);
                const isImagem = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(anx.tipo_arquivo || '');
                const isPdf = anx.tipo_arquivo === 'pdf';
                return (
                  <div key={anx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0.9rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {iconeArquivo(anx.tipo_arquivo)}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {anx.nome_arquivo}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                            {(anx.tipo_arquivo || '').toUpperCase()} · {formatBytes(anx.tamanho_bytes)}
                          </p>
                        </div>
                      </div>
                      <a href={url} download={anx.nome_arquivo} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.75rem', borderRadius: 8, background: '#eff6ff', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                      >
                        <Download size={13} /> Baixar
                      </a>
                    </div>
                    <div style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isImagem ? (
                        <img src={url} alt={anx.nome_arquivo} style={{ maxWidth: '100%', maxHeight: 400, display: 'block', margin: '0 auto' }} />
                      ) : isPdf ? (
                        <iframe src={url} title={anx.nome_arquivo} style={{ width: '100%', height: 420, border: 'none' }} />
                      ) : (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {iconeArquivo(anx.tipo_arquivo)}
                          <p style={{ margin: '8px 0 0' }}>Pré-visualização não disponível para este tipo — use "Baixar" para abrir.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {(anexosByProg[viewingRow.id] || []).length === 0 && (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum anexo encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Programacao;
