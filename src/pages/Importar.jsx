import { useRef, useState } from 'react';
import { Upload, Download, Database, RefreshCw, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { useCadastros } from '../context/CadastrosContext';
import { parseExcel, generateTemplate, exportToExcel, generateTemplateProgramacao, exportToExcelProgramacao } from '../utils/excelParser';

const Importar = () => {
  const { importFromExcel, importing: importingFleet, importError: errFleet, rawData: rawFleet, clearData: clearFleet, filtered: filteredFleet, loadFromDB: loadFleetDB } = useFleet();
  const { programacoes, importProgramacaoExcel, clearProgramacao } = useCadastros();

  const [tab, setTab] = useState('diario'); // 'diario' or 'programacao'
  const inputRef = useRef();
  const [parsing, setParsing]     = useState(false);
  const [parseError, setParseError] = useState('');
  const [imported, setImported]   = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const process = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext)) { setParseError('Formato inválido. Use .xlsx ou .xls'); return; }
    setParsing(true); setParseError(''); setImported(null);
    try {
      const data = await parseExcel(file);
      if (data.length === 0) throw new Error('Nenhum dado encontrado na planilha.');
      
      if (tab === 'diario') {
        const ok = await importFromExcel(data);
        if (ok) setImported(data.length);
      } else {
        const ok = await importProgramacaoExcel(data);
        if (ok) setImported(data.length);
      }
    } catch (e) {
      setParseError(e.message || 'Erro ao processar a planilha.');
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    if (tab === 'diario') await clearFleet();
    else await clearProgramacao();
    
    setConfirmClear(false);
    setImported(null);
  };

  const busy = parsing || (tab === 'diario' ? importingFleet : false);
  const importErrorMsg = tab === 'diario' ? errFleet : '';

  const dbCount = tab === 'diario' ? rawFleet.length : programacoes.length;
  const loadDB = tab === 'diario' ? loadFleetDB : () => window.location.reload();
  
  const handleExport = () => {
    if (tab === 'diario') {
      exportToExcel(filteredFleet, `frota_diario_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`);
    } else {
      exportToExcelProgramacao(programacoes, `programacao_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`);
    }
  };
  const exportDisabled = tab === 'diario' ? filteredFleet.length === 0 : programacoes.length === 0;
  const exportCount = tab === 'diario' ? filteredFleet.length : programacoes.length;

  const handleTemplate = () => {
    if (tab === 'diario') generateTemplate();
    else generateTemplateProgramacao();
  };

  const tableName = tab === 'diario' ? 'frota_diario' : 'programacao';

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '0.25rem' }}>Importar / Exportar</h1>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.75rem' }}>Gerencie os dados da frota via planilha Excel</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => { setTab('diario'); setImported(null); setParseError(''); setConfirmClear(false); }}
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: tab === 'diario' ? '2px solid #E30613' : '2px solid transparent', color: tab === 'diario' ? '#E30613' : '#64748b', fontWeight: tab === 'diario' ? 700 : 500, cursor: 'pointer' }}
        >
          Frota Diário
        </button>
        <button 
          onClick={() => { setTab('programacao'); setImported(null); setParseError(''); setConfirmClear(false); }}
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: tab === 'programacao' ? '2px solid #E30613' : '2px solid transparent', color: tab === 'programacao' ? '#E30613' : '#64748b', fontWeight: tab === 'programacao' ? 700 : 500, cursor: 'pointer' }}
        >
          Programação
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', maxWidth: 900 }}>

        {/* Status do banco */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Database size={18} color="#16a34a" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Banco de Dados ({tableName})</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{dbCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>registros no banco</div>
          <button onClick={loadDB} style={{
            marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer',
          }}>
            <RefreshCw size={13} /> Recarregar
          </button>
        </div>

        {/* Importar Excel */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #E30613' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Upload size={18} color="#E30613" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Importar Excel ({tab === 'diario' ? 'Diário' : 'Programação'})</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Os dados da planilha serão adicionados ao banco de dados existente.
          </p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsm" style={{ display: 'none' }} onChange={e => process(e.target.files[0])} />
          <button onClick={() => inputRef.current?.click()} disabled={busy} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none',
            background: busy ? '#7f1d1d' : '#E30613', color: 'white',
            fontWeight: 600, fontSize: '0.85rem', cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}>
            {busy ? <><RefreshCw size={14} /> Importando...</> : <><FileSpreadsheet size={14} /> Selecionar Planilha</>}
          </button>
          {imported !== null && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>✓ {imported} registros importados!</p>}
          {(parseError || importErrorMsg) && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#E30613' }}>⚠️ {parseError || importErrorMsg}</p>}
        </div>

        {/* Exportar Excel */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Download size={18} color="#16a34a" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Exportar Excel</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Exporta os dados com os filtros ativos ({exportCount} registro(s) selecionados).
          </p>
          <button onClick={handleExport}
            disabled={exportDisabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid rgba(22,163,74,0.3)',
              background: 'rgba(22,163,74,0.08)', color: '#16a34a',
              fontWeight: 600, fontSize: '0.85rem',
              cursor: exportDisabled ? 'not-allowed' : 'pointer',
              opacity: exportDisabled ? 0.5 : 1,
            }}>
            <Download size={14} /> Exportar ({exportCount})
          </button>
        </div>

        {/* Template */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FileSpreadsheet size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Template ({tab === 'diario' ? 'Diário' : 'Programação'})</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Baixe o modelo de planilha em Excel com as colunas certas e um exemplo.
          </p>
          <button onClick={handleTemplate} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)',
            background: 'rgba(124,58,237,0.08)', color: '#7c3aed',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <Download size={14} /> Baixar Template .xlsx
          </button>
        </div>

        {/* Limpar banco */}
        {dbCount > 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Trash2 size={18} color="#ef4444" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Limpar Banco</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Apaga todos os registros de <strong>{tableName}</strong>. Ação irreversível.
            </p>
            <button onClick={handleClear} onBlur={() => setConfirmClear(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
              background: confirmClear ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.07)',
              color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}>
              <Trash2 size={14} /> {confirmClear ? 'Confirmar exclusão?' : 'Limpar todos os dados'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Importar;
