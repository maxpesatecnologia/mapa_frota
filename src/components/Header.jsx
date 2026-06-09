import React, { useRef, useState } from 'react';
import { LayoutGrid, Map, Upload, RefreshCw, FileSpreadsheet, X } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { parseExcel } from '../utils/excelParser';

const Header = () => {
  const { view, setView, loadData, clearData, uploadedAt, fileName, rawData } = useFleet();
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await parseExcel(file);
      loadData(data, file);
    } catch {
      alert('Erro ao processar o arquivo. Verifique o formato.');
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (d) => d
    ? `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <header style={{
      height: 'var(--header-h)',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '1rem',
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#E30613',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.1rem' }}>M</span>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '1rem', color: 'white' }}>MAPA OPERACIONAL</div>
          <div style={{ fontFamily: 'Oswald', fontWeight: 500, fontSize: '0.7rem', color: '#FF6A00', letterSpacing: '2px' }}>
            FROTA MAXPESA
          </div>
        </div>
      </div>

      {/* File info */}
      {rawData.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.3rem 0.75rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8, marginLeft: '0.5rem',
          flexShrink: 0,
        }}>
          <FileSpreadsheet size={13} color="#64748b" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName}
          </span>
          {uploadedAt && (
            <span style={{ fontSize: '0.7rem', color: '#475569' }}>· {fmtTime(uploadedAt)}</span>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* View toggle */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}>
        {[
          { id: 'cards', icon: <LayoutGrid size={16} />, label: 'Cartões' },
          { id: 'map',   icon: <Map size={16} />,        label: 'Mapa'    },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 8,
              background: view === id ? '#E30613' : 'transparent',
              color: view === id ? 'white' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          padding: '0.45rem 1rem',
          borderRadius: 8,
          background: '#E30613',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.8rem',
        }}
      >
        {loading
          ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...</>
          : <><Upload size={14} /> {rawData.length > 0 ? 'Atualizar' : 'Importar'}</>
        }
      </button>

      {rawData.length > 0 && (
        <button
          onClick={clearData}
          title="Limpar dados"
          style={{ padding: '0.45rem', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: '#64748b' }}
        >
          <X size={16} />
        </button>
      )}
    </header>
  );
};

export default Header;
