import * as XLSX from 'xlsx';

const col = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return '';
};

const fmtDate = (v) => {
  if (!v) return '';
  if (v instanceof Date) {
    return v.toLocaleDateString('pt-BR');
  }
  return String(v);
};

export const parseExcel = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const normalized = rows
          .map((row) => ({
            data:         fmtDate(col(row, 'Data', 'DATA', 'data', 'DT', 'Dt')),
            frota:        String(col(row, 'Frota', 'FROTA', 'frota', 'Nº Frota', 'N Frota', 'NUMERO FROTA')).trim(),
            equipamento:  String(col(row, 'Equipamento', 'EQUIPAMENTO', 'equipamento', 'Equip', 'EQUIP')).trim(),
            familia:      String(col(row, 'Família', 'Familia', 'FAMILIA', 'família', 'familia', 'FAMÍLIA', 'Tipo')).trim(),
            cliente:      String(col(row, 'Cliente', 'CLIENTE', 'cliente', 'Local', 'LOCAL', 'Obra')).trim(),
            operador:     String(col(row, 'Operador', 'OPERADOR', 'operador', 'Operadores', 'Nome Operador')).trim(),
            status:       String(col(row, 'Status', 'STATUS', 'status', 'Situação', 'SITUAÇÃO', 'Situacao')).trim(),
            configuracao: String(col(row, 'Configuração', 'Configuracao', 'CONFIGURACAO', 'Config', 'CONFIG', 'configuracao')).trim(),
          }))
          .filter((r) => r.frota);

        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });

export const generateTemplate = () => {
  const data = [
    ['Data', 'Frota', 'Equipamento', 'Família', 'Cliente', 'Operador', 'Status', 'Configuração'],
    ['15/01/2026', 'GD-250-250', 'Guindaste 250T', 'Guindaste', 'Eletronuclear', 'Sirlei Macedo', 'T', '250T c/ lança 80m'],
    ['15/01/2026', 'GD-080-252', 'Guindaste 80T',  'Guindaste', 'Eletronuclear', 'Carlos Lima',   'T', '80T c/ jib'],
    ['15/01/2026', 'GD-110-240', 'Guindaste 110T', 'Guindaste', 'Vale',          'João Silva',    'T', '110T padrão'],
    ['15/01/2026', 'GD-180-300', 'Guindaste 180T', 'Guindaste', 'Base Maxpesa',  '',              'D', ''],
    ['15/01/2026', 'GD-220-180', 'Guindaste 220T', 'Guindaste', 'Base Maxpesa',  '',              'Corretiva', 'Aguardando peças'],
    ['15/01/2026', 'PL-040-010', 'Plataforma 40T', 'Plataforma', 'Petrobras',    'Ana Costa',     'T', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Programação');
  XLSX.writeFile(wb, 'template_frota_maxpesa.xlsx');
};
