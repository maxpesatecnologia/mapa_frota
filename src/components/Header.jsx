import { useRef, useState } from 'react';
import { LayoutGrid, Map, Upload, RefreshCw, Download, Trash2 } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { parseExcel, exportToExcel } from '../utils/excelParser';

const Header = () => {
  const { view, setView, importFromExcel, clearData, filtered, rawData, importing } = useFleet();
  const inputRef = useRef();
  const [parsing, setParsing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const data = await parseExcel(file);
      if (data.length === 0) { alert('Nenhum dado encontrado na planilha.'); return; }
      await importFromExcel(data);
    } catch {
      alert('Erro ao processar o arquivo. Verifique o formato.');
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearData();
    setConfirmClear(false);
  };

  const handleExport = () => {
    exportToExcel(filtered, `frota_export_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  const busy = parsing || importing;

  return (
    <header style={{
      height: 'var(--header-h)',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '0.75rem',
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

      {/* Record count */}
      {rawData.length > 0 && (
        <div style={{
          padding: '0.3rem 0.75rem',
          background: 'rgba(56,161,105,0.1)',
          border: '1px solid rgba(56,161,105,0.25)',
          borderRadius: 8,
          fontSize: '0.75rem', color: '#68d391',
          flexShrink: 0,
        }}>
          {rawData.length} registros
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
          { id: 'cards', icon: <LayoutGrid size={15} />, label: 'Cartões' },
          { id: 'map',   icon: <Map size={15} />,        label: 'Mapa'    },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 8,
              background: view === id ? '#E30613' : 'transparent',
              color: view === id ? 'white' : '#64748b',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Export Excel */}
      {filtered.length > 0 && (
        <button
          onClick={handleExport}
          title="Exportar dados filtrados para Excel"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 8,
            background: 'rgba(56,161,105,0.15)',
            border: '1px solid rgba(56,161,105,0.3)',
            color: '#68d391',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          <Download size={14} /> Exportar
        </button>
      )}

      {/* Import button */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.45rem 1rem',
          borderRadius: 8,
          background: busy ? '#7f1d1d' : '#E30613',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.78rem',
          cursor: busy ? 'not-allowed' : 'pointer',
          border: 'none',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy
          ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importando...</>
          : <><Upload size={14} /> Importar</>
        }
      </button>

      {/* Clear data */}
      {rawData.length > 0 && (
        <button
          onClick={handleClear}
          onBlur={() => setConfirmClear(false)}
          title={confirmClear ? 'Clique de novo para confirmar' : 'Apagar todos os dados do banco'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.75rem',
            borderRadius: 8,
            background: confirmClear ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.07)',
            color: confirmClear ? '#fca5a5' : '#64748b',
            fontSize: '0.75rem',
            fontWeight: confirmClear ? 700 : 400,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} />
          {confirmClear ? 'Confirmar?' : ''}
        </button>
      )}
    </header>
  );
};

export default Header;
