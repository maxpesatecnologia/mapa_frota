// Coordenadas de clientes conhecidos da Maxpesa na região do Rio de Janeiro
const COORDS = {
  'ELETRONUCLEAR':          { lat: -23.0081, lng: -44.3126, city: 'Angra dos Reis, RJ' },
  'ANGRA':                  { lat: -23.0081, lng: -44.3126, city: 'Angra dos Reis, RJ' },
  'VALE':                   { lat: -22.8682, lng: -43.4467, city: 'Itaguaí, RJ' },
  'VALE ITAGUAI':           { lat: -22.8682, lng: -43.4467, city: 'Itaguaí, RJ' },
  'PETROBRAS':              { lat: -22.9489, lng: -43.1730, city: 'Rio de Janeiro, RJ' },
  'PETROBRAS CAMPOS':       { lat: -21.7333, lng: -41.3167, city: 'Campos dos Goytacazes, RJ' },
  'TRANSPETRO':             { lat: -22.8840, lng: -43.1002, city: 'Rio de Janeiro, RJ' },
  'NUCLEP':                 { lat: -22.9310, lng: -43.6560, city: 'Itaguaí, RJ' },
  'CNAAA':                  { lat: -23.0081, lng: -44.3126, city: 'Angra dos Reis, RJ' },
  'TERMINAL':               { lat: -22.8640, lng: -43.4381, city: 'Itaguaí, RJ' },
  'PORTO':                  { lat: -22.8995, lng: -43.1729, city: 'Rio de Janeiro, RJ' },
  'TKCSA':                  { lat: -22.9200, lng: -43.6290, city: 'Santa Cruz, RJ' },
  'COMPANHIA SIDERURGICA':  { lat: -22.9200, lng: -43.6290, city: 'Santa Cruz, RJ' },
  'CSN':                    { lat: -22.5152, lng: -44.0976, city: 'Volta Redonda, RJ' },
  'VOLTA REDONDA':          { lat: -22.5152, lng: -44.0976, city: 'Volta Redonda, RJ' },
  'BASE MAXPESA':           { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'MAXPESA':                { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'PATIO':                  { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'PÁTIO':                  { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'NOVA IGUACU':            { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'NOVA IGUAÇU':            { lat: -22.7461, lng: -43.4539, city: 'Nova Iguaçu, RJ' },
  'RIO DE JANEIRO':         { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro, RJ' },
  'NITEROI':                { lat: -22.8832, lng: -43.1034, city: 'Niterói, RJ' },
  'NITERÓI':                { lat: -22.8832, lng: -43.1034, city: 'Niterói, RJ' },
  'DUQUE DE CAXIAS':        { lat: -22.7858, lng: -43.3117, city: 'Duque de Caxias, RJ' },
  'SEPETIBA':               { lat: -22.9744, lng: -43.7114, city: 'Sepetiba, RJ' },
};

export const getClientCoords = (name) => {
  if (!name) return null;
  const key = String(name).trim().toUpperCase();
  if (COORDS[key]) return COORDS[key];
  // Partial match: does any known key appear within the client name?
  for (const [k, v] of Object.entries(COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
};
