export const STATUS_MAP = {
  'T':             { label: 'Trabalhando',   color: '#15803d', bg: '#dcfce7', border: '#15803d', dot: '#16a34a' },
  'TRABALHANDO':   { label: 'Trabalhando',   color: '#15803d', bg: '#dcfce7', border: '#15803d', dot: '#16a34a' },
  'D':             { label: 'Disponível',    color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
  'DISPONIVEL':    { label: 'Disponível',    color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
  'DISPONÍVEL':    { label: 'Disponível',    color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
  'TRANSF':        { label: 'Transferência', color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'TRANSFERENCIA': { label: 'Transferência', color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'TRANSFERÊNCIA': { label: 'Transferência', color: '#1d4ed8', bg: '#dbeafe', border: '#1d4ed8', dot: '#2563eb' },
  'RESERVA':       { label: 'Reserva',       color: '#92400e', bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  'PREVENTIVA':    { label: 'Preventiva',    color: '#c2410c', bg: '#ffedd5', border: '#ea580c', dot: '#ea580c' },
  'CORRETIVA':     { label: 'Corretiva',     color: '#b91c1c', bg: '#fee2e2', border: '#dc2626', dot: '#dc2626' },
  'INDISPONIVEL':  { label: 'Indisponível',  color: '#374151', bg: '#f3f4f6', border: '#6b7280', dot: '#4b5563' },
  'INDISPONÍVEL':  { label: 'Indisponível',  color: '#374151', bg: '#f3f4f6', border: '#6b7280', dot: '#4b5563' },
};

export const getStatus = (raw) => {
  if (!raw) return STATUS_MAP['D'];
  const key = String(raw).trim().toUpperCase();
  return STATUS_MAP[key] || { label: raw, color: '#475569', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' };
};

export const STATUS_ORDER = ['T', 'D', 'TRANSF', 'RESERVA', 'PREVENTIVA', 'CORRETIVA', 'INDISPONIVEL'];

export const isMaintenance = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'PREVENTIVA' || k === 'CORRETIVA';
};

export const isWorking = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'T' || k === 'TRABALHANDO';
};

export const isAvailable = (raw) => {
  const k = String(raw || '').trim().toUpperCase();
  return k === 'D' || k === 'DISPONIVEL' || k === 'DISPONÍVEL';
};
