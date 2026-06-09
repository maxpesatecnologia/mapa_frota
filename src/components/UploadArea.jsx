import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { parseExcel, generateTemplate } from '../utils/excelParser';

const UploadArea = () => {
  const { loadData } = useFleet();
  const inputRef     = useRef();
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const process = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext)) {
      setError('Formato inválido. Use .xlsx ou .xls');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await parseExcel(file);
      if (data.length === 0) throw new Error('Nenhum dado encontrado na planilha.');
      loadData(data, file);
    } catch (e) {
      setError(e.message || 'Erro ao processar a planilha.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    process(e.dataTransfer.files[0]);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '2rem',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#E30613',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 3px rgba(227,6,19,0.3)',
          }}>
            <span style={{ color: 'white', fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.5rem' }}>M</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.6rem', color: 'white', lineHeight: 1 }}>
              MAPA OPERACIONAL
            </div>
            <div style={{ fontFamily: 'Oswald', fontWeight: 500, fontSize: '1rem', color: '#FF6A00', letterSpacing: '3px' }}>
              FROTA MAXPESA
            </div>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Visualização operacional em tempo real
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          maxWidth: 480,
          border: `2px dashed ${dragging ? '#E30613' : '#334155'}`,
          borderRadius: 16,
          background: dragging ? 'rgba(227,6,19,0.05)' : 'rgba(255,255,255,0.03)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: dragging ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.xlsm"
          style={{ display: 'none' }}
          onChange={(e) => process(e.target.files[0])}
        />

        {loading ? (
          <div style={{ color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'pulse 1s infinite' }}>⏳</div>
            <p style={{ fontWeight: 600, color: 'white' }}>Processando planilha...</p>
          </div>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(227,6,19,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <Upload size={28} color="#E30613" />
            </div>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              Importar Programação da Frota
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Arraste sua planilha aqui ou clique para selecionar
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', fontSize: '0.78rem',
            }}>
              <FileSpreadsheet size={14} />
              .xlsx · .xls · .xlsm
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '1rem', padding: '0.75rem 1.25rem',
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 8, color: '#fca5a5', fontSize: '0.875rem', maxWidth: 480, width: '100%',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Template download */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Não tem a planilha no formato correto?
        </p>
        <button
          onClick={generateTemplate}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '0.5rem 1.2rem',
            color: '#94a3b8',
            fontSize: '0.8rem',
            gap: '0.4rem',
          }}
        >
          <Download size={14} />
          Baixar Template Excel
        </button>
      </div>

      {/* Fields hint */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480 }}>
        {['Data', 'Frota', 'Equipamento', 'Família', 'Cliente', 'Operador', 'Status', 'Configuração'].map(f => (
          <span key={f} style={{
            fontSize: '0.72rem', padding: '3px 8px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', color: '#64748b',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
};

export default UploadArea;
