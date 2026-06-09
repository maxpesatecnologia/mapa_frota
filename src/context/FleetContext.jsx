import React, { createContext, useContext, useState, useMemo } from 'react';
import { isWorking, isAvailable, isMaintenance } from '../utils/statusConfig';

const FleetContext = createContext(null);

export const FleetProvider = ({ children }) => {
  const [rawData, setRawData]       = useState([]);
  const [view, setView]             = useState('cards');   // 'cards' | 'map'
  const [uploadedAt, setUploadedAt] = useState(null);
  const [fileName, setFileName]     = useState('');
  const [filters, setFilters]       = useState({
    cliente:  'all',
    familia:  'all',
    status:   'all',
    operador: 'all',
    search:   '',
  });

  const loadData = (data, file) => {
    setRawData(data);
    setUploadedAt(new Date());
    setFileName(file?.name || '');
    setFilters({ cliente: 'all', familia: 'all', status: 'all', operador: 'all', search: '' });
  };

  const clearData = () => {
    setRawData([]);
    setUploadedAt(null);
    setFileName('');
  };

  const options = useMemo(() => ({
    clientes:  ['all', ...Array.from(new Set(rawData.map(r => r.cliente).filter(Boolean))).sort()],
    familias:  ['all', ...Array.from(new Set(rawData.map(r => r.familia).filter(Boolean))).sort()],
    statuses:  ['all', ...Array.from(new Set(rawData.map(r => r.status).filter(Boolean))).sort()],
    operadores:['all', ...Array.from(new Set(rawData.map(r => r.operador).filter(Boolean))).sort()],
  }), [rawData]);

  const filtered = useMemo(() => {
    return rawData.filter(r => {
      if (filters.cliente  !== 'all' && r.cliente  !== filters.cliente)  return false;
      if (filters.familia  !== 'all' && r.familia  !== filters.familia)  return false;
      if (filters.status   !== 'all' && r.status   !== filters.status)   return false;
      if (filters.operador !== 'all' && r.operador !== filters.operador) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const fields = [r.frota, r.equipamento, r.cliente, r.operador, r.familia].join(' ').toLowerCase();
        if (!fields.includes(q)) return false;
      }
      return true;
    });
  }, [rawData, filters]);

  const kpis = useMemo(() => {
    const total      = rawData.length;
    const operando   = rawData.filter(r => isWorking(r.status)).length;
    const disponivel = rawData.filter(r => isAvailable(r.status)).length;
    const manutencao = rawData.filter(r => isMaintenance(r.status)).length;
    const taxa       = total > 0 ? Math.round((operando / total) * 100) : 0;
    return { total, operando, disponivel, manutencao, taxa };
  }, [rawData]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length
    + (filters.search ? 1 : 0);

  return (
    <FleetContext.Provider value={{
      rawData, loadData, clearData,
      filtered, options,
      filters, setFilters,
      view, setView,
      kpis, uploadedAt, fileName,
      activeFilterCount,
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => useContext(FleetContext);
