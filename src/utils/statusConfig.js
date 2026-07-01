export const STATUS_MAP = {
  'T':                 { label: 'Trabalhando',         color: '#15803d', bg: '#dcfce7', border: '#15803d', dot: '#16a34a' },
  'TRABALHANDO':       { label: 'Trabalhando',         color: '#15803d', bg: '#dcfce7', border: '#15803d', dot: '#16a34a' },
  'M':                 { label: 'Mobilização',         color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'MOBILIZACAO':       { label: 'Mobilização',         color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'MOBILIZAÇÃO':       { label: 'Mobilização',         color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'DM':                { label: 'Desmobilização',      color: '#92400e', bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  'DESMOBILIZACAO':    { label: 'Desmobilização',      color: '#92400e', bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  'DESMOBILIZAÇÃO':    { label: 'Desmobilização',      color: '#92400e', bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  'RR':                { label: 'Reserva Remunerada',  color: '#6d28d9', bg: '#ede9fe', border: '#7c3aed', dot: '#7c3aed' },
  'RESERVA REMUNERADA':{ label: 'Reserva Remunerada',  color: '#6d28d9', bg: '#ede9fe', border: '#7c3aed', dot: '#7c3aed' },
};

export const getStatus = (raw) => {
  if (!raw) return { label: '—', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' };
  const key = String(raw).trim().toUpperCase();
  return STATUS_MAP[key] || { label: raw, color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' };
};

export const STATUS_ORDER = ['T', 'M', 'DM'];

export const isWorking = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'T';
};

export const isMobilization = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'M' || k === 'MOBILIZACAO' || k === 'MOBILIZAÇÃO';
};

export const isDemobilization = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'DM' || k === 'DESMOBILIZACAO' || k === 'DESMOBILIZAÇÃO';
};

export const isReservaRemunerada = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'RR' || k === 'RESERVA REMUNERADA';
};

// Retorna o grupo de status para agrupamento de clientes atendidos
export const getStatusGroup = (raw) => {
  const st = String(raw || '').trim().toUpperCase();
  if (st.includes('DESMOBILIZ') || st === 'DM') return 'desmobilizacao';
  if (st === 'T' || st === 'TRABALHANDO' || st.startsWith('T ') || st.startsWith('T-') || st.includes('SPOT') || st.includes('CONTRATO')) return 'trabalhando';
  if (st === 'M' || st.startsWith('M ') || st.includes('MOBILIZ')) return 'mobilizacao';
  if (st === 'RR' || st.includes('RESERVA')) return 'reserva';
  return null;
};
