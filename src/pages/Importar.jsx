import { useRef, useState } from 'react';
import { Upload, Download, Database, RefreshCw, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useCadastros } from '../context/CadastrosContext';
import { generateTemplateProgramacao, exportToExcelProgramacao } from '../utils/excelParser';
import { parseExcel } from '../utils/excelParser';

const Importar = () => {
  const { programacoes, importProgramacaoExcel, clearProgramacao, loadProgramacoes } = useCadastros();

  const inputRef = useRef();
  const [parsing, setParsing]       = useState(false);
  const [parseError, setParseError] = useState('');
  const [imported, setImported]     = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const process = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext)) { setParseError('Formato inválido. Use .xlsx ou .xls'); return; }
    setParsing(true); setParseError(''); setImported(null);
    try {
      const data = await parseExcel(file);
      if (data.length === 0) throw new Error('Nenhum dado encontrado na planilha.');
      const ok = await importProgramacaoExcel(data);
      if (ok) setImported(data.length);
    } catch (e) {
      setParseError(e.message || 'Erro ao processar a planilha.');
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearProgramacao();
    setConfirmClear(false);
    setImported(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const fresh = await loadProgramacoes();
      exportToExcelProgramacao(fresh, `programacao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '0.25rem' }}>Importar / Exportar</h1>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.75rem' }}>Gerencie os dados da programação via planilha Excel</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', maxWidth: 900 }}>

        {/* Status do banco */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Database size={18} color="#16a34a" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Banco de Dados (programacao)</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{programacoes.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>registros no banco</div>
          <button onClick={loadProgramacoes} style={{
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
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Importar Excel (Programação)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            A planilha substituirá todos os dados existentes no banco.
          </p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsm" style={{ display: 'none' }} onChange={e => process(e.target.files[0])} />
          <button onClick={() => inputRef.current?.click()} disabled={parsing} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none',
            background: parsing ? '#7f1d1d' : '#E30613', color: 'white',
            fontWeight: 600, fontSize: '0.85rem', cursor: parsing ? 'not-allowed' : 'pointer',
            opacity: parsing ? 0.7 : 1,
          }}>
            {parsing ? <><RefreshCw size={14} /> Importando...</> : <><FileSpreadsheet size={14} /> Selecionar Planilha</>}
          </button>
          {imported !== null && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>✓ {imported} registros importados!</p>}
          {parseError && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#E30613' }}>⚠️ {parseError}</p>}
        </div>

        {/* Exportar Excel */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Download size={18} color="#16a34a" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Exportar Excel</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Exporta todos os registros de programação, antigos e recém-adicionados ({programacoes.length} registro(s) carregado(s)).
          </p>
          <button onClick={handleExport} disabled={exporting || programacoes.length === 0} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid rgba(22,163,74,0.3)',
            background: 'rgba(22,163,74,0.08)', color: '#16a34a',
            fontWeight: 600, fontSize: '0.85rem',
            cursor: (exporting || programacoes.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (exporting || programacoes.length === 0) ? 0.5 : 1,
          }}>
            {exporting
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Atualizando e exportando...</>
              : <><Download size={14} /> Exportar ({programacoes.length})</>
            }
          </button>
        </div>

        {/* Template */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FileSpreadsheet size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Template (Programação)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Baixe o modelo de planilha em Excel com as colunas certas e um exemplo.
          </p>
          <button onClick={generateTemplateProgramacao} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)',
            background: 'rgba(124,58,237,0.08)', color: '#7c3aed',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <Download size={14} /> Baixar Template .xlsx
          </button>
        </div>

        {/* Limpar banco */}
        {programacoes.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderTop: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Trash2 size={18} color="#ef4444" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Limpar Banco</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Apaga todos os registros de <strong>programacao</strong>. Ação irreversível.
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
