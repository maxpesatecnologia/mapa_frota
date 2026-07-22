import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isWorking, isMobilization, isDemobilization } from '../utils/statusConfig';

const FleetContext = createContext(null);
const TABLE = 'frota_diario';

export const FleetProvider = ({ children }) => {
  const [rawData, setRawData]   = useState([]);
  const [view, setView]         = useState('cards');
  const [loading, setLoading]   = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [filters, setFilters]   = useState({
    cliente:    'all',
    familia:    'all',
    status:     'all',
    operador:   'all',
    search:     '',
    dataInicio: '',
    dataFim:    '',
  });

  // Carrega dados do Supabase ao iniciar
  const loadFromDB = useCallback(async () => {
    setLoading(true);
    const allData = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('iso_date', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + step - 1);

      if (error) {
        console.error('Erro ao carregar dados:', error.message);
        break;
      }
      
      if (data && data.length > 0) {
        allData.push(...data); // push direto evita cópias O(n²)
        from += step;
      }
      
      if (!data || data.length < step) {
        hasMore = false;
      }
    }

    setRawData(allData);
    setLoading(false);
  }, []);

  useEffect(() => { loadFromDB(); }, [loadFromDB]);

  // Importa do Excel → insere no Supabase → recarrega
  const importFromExcel = async (rows) => {
    setImporting(true);
    setImportError('');

    // Remove campos extras que não existem na tabela
    const clean = rows.map(({ data, ...rest }) => ({ ...rest }));

    const CHUNK = 500;
    for (let i = 0; i < clean.length; i += CHUNK) {
      const chunk = clean.slice(i, i + CHUNK);
      const { error } = await supabase.from(TABLE).insert(chunk);
      if (error) {
        setImportError(`Erro ao importar: ${error.message}`);
        setImporting(false);
        return false;
      }
    }

    await loadFromDB();
    setImporting(false);
    return true;
  };

  // Apaga todos os registros (com confirmação no componente)
  const clearData = async () => {
    const { error } = await supabase.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) {
      setRawData([]);
      setFilters({ cliente: 'all', familia: 'all', status: 'all', operador: 'all', search: '', dataInicio: '', dataFim: '' });
    }
    return !error;
  };

  const options = useMemo(() => ({
    clientes:  ['all', ...Array.from(new Set(rawData.map(r => r.cliente).filter(Boolean))).sort()],
    familias:  ['all', ...Array.from(new Set(rawData.map(r => r.familia).filter(Boolean))).sort()],
    statuses:  ['all', ...Array.from(new Set(rawData.map(r => r.status).filter(Boolean))).sort()],
    operadores:['all', ...Array.from(new Set(rawData.map(r => r.operador).filter(Boolean))).sort()],
  }), [rawData]);

  const filtered = useMemo(() => {
    return rawData
      .filter(r => {
        if (filters.cliente  !== 'all' && r.cliente  !== filters.cliente)  return false;
        if (filters.familia  !== 'all' && r.familia  !== filters.familia)  return false;
        if (filters.status   !== 'all' && r.status   !== filters.status)   return false;
        if (filters.operador !== 'all' && r.operador !== filters.operador) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const fields = [r.frota, r.placa, r.equipamento, r.cliente, r.operador, r.familia].join(' ').toLowerCase();
          if (!fields.includes(q)) return false;
        }
        if (filters.dataInicio && r.iso_date < filters.dataInicio) return false;
        if (filters.dataFim    && r.iso_date > filters.dataFim)    return false;
        return true;
      })
      .sort((a, b) => {
        if (b.iso_date > a.iso_date) return 1;
        if (b.iso_date < a.iso_date) return -1;
        return (a.placa || a.frota || '').localeCompare(b.placa || b.frota || '', 'pt-BR');
      });
  }, [rawData, filters]);

  const kpis = useMemo(() => {
    const byFrota = new Map();
    filtered.forEach(r => {
      const key = r.placa || r.frota;
      const prev = byFrota.get(key);
      if (!prev || r.iso_date >= prev.iso_date) byFrota.set(key, r);
    });
    const unique         = Array.from(byFrota.values());
    const total          = unique.length;
    const operando       = unique.filter(r => isWorking(r.status)).length;
    const mobilizacao    = unique.filter(r => isMobilization(r.status)).length;
    const desmobilizacao = unique.filter(r => isDemobilization(r.status)).length;
    const taxa           = total > 0 ? Math.round((operando / total) * 100) : 0;
    return { total, operando, mobilizacao, desmobilizacao, taxa };
  }, [filtered]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'search' && k !== 'dataInicio' && k !== 'dataFim' && v !== 'all'
  ).length
    + (filters.search ? 1 : 0)
    + (filters.dataInicio ? 1 : 0)
    + (filters.dataFim    ? 1 : 0);

  return (
    <FleetContext.Provider value={{
      rawData, filtered, options,
      filters, setFilters,
      view, setView,
      kpis,
      loading, importing, importError,
      importFromExcel, clearData, loadFromDB,
      activeFilterCount,
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => useContext(FleetContext);
