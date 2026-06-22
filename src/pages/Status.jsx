import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Activity } from 'lucide-react';
import { useCadastros } from '../context/CadastrosContext';

const EMPTY = { nome: '' };

const Status = () => {
  const { statusList, saveStatus, deleteStatus } = useCadastros();
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  const openNew  = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ nome: s.nome });
    setEditId(s.id);
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditId(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    await saveStatus(form, editId);
    setSaving(false);
    close();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este status?')) return;
    await deleteStatus(id);
  };

  const filtered = statusList.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', color: '#1e293b' }}>Status de Programação</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
            {statusList.length} status cadastrado(s)
          </p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: '#E30613', color: 'white', border: 'none',
          padding: '0.55rem 1.1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
        }}>
          <Plus size={16} /> Novo Status
        </button>
      </div>

      <input
        type="text" placeholder="Buscar status..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 380, marginBottom: '1rem', padding: '0.55rem 0.9rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
      />

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Status', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                {statusList.length === 0 ? 'Nenhum status cadastrado.' : 'Nenhum resultado.'}
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                onMouseEnter={ev => ev.currentTarget.style.background = '#fafbfd'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={14} color="#94a3b8" /> {s.nome}
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => openEdit(s)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} style={{ padding: '0.35rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#E30613', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1e293b' }}>{editId ? 'Editar Status' : 'Novo Status'}</h2>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Nome do Status *</label>
              <input
                value={form.nome}
                onChange={e => setForm({ nome: e.target.value })}
                placeholder="Ex: Em Andamento"
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={close} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nome.trim()} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none',
                background: '#E30613', color: 'white', fontWeight: 600, fontSize: '0.875rem',
                cursor: (saving || !form.nome.trim()) ? 'not-allowed' : 'pointer', opacity: (saving || !form.nome.trim()) ? 0.7 : 1,
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

export default Status;
