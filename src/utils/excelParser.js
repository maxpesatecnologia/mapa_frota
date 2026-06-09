import * as XLSX from 'xlsx';

// Normalize a column header for fuzzy matching:
// lowercase + remove Portuguese accents + keep only alphanumeric
const norm = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[aáàâãä]/g, 'a')
    .replace(/[eéèêë]/g, 'e')
    .replace(/[iíìîï]/g, 'i')
    .replace(/[oóòôõö]/g, 'o')
    .replace(/[uúùûü]/g, 'u')
    .replace(/[cç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');

const fmtDate = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toLocaleDateString('pt-BR');
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

        if (rows.length === 0) { resolve([]); return; }

        // Build a map: normalizedHeader -> originalHeader
        const rawKeys = Object.keys(rows[0]);
        const keyMap = {};
        rawKeys.forEach((k) => { keyMap[norm(k)] = k; });

        // Find the best matching original column key from a list of aliases
        const findKey = (...aliases) => {
          for (const alias of aliases) {
            const found = keyMap[norm(alias)];
            if (found !== undefined) return found;
          }
          return null;
        };

        const kData    = findKey('data', 'dt', 'date', 'data programacao', 'dataprog');
        const kFrota   = findKey('frota', 'n frota', 'numero frota', 'nfrota', 'cod frota', 'placa', 'equipamento id');
        const kEquip   = findKey('equipamento', 'equip', 'descricao', 'desc', 'maquina', 'descequipamento');
        const kFamilia = findKey('familia', 'tipo', 'categoria', 'tipoequip', 'tipo equipamento', 'classe');
        const kCliente = findKey('cliente', 'clientes', 'local', 'obra', 'contrato', 'nome cliente', 'nomecliente', 'localobra');
        const kOper    = findKey('operador', 'operadores', 'nome operador', 'nomeoperador', 'motorista', 'condutor', 'colaborador');
        const kStatus  = findKey('status', 'situacao', 'situação', 'estado', 'condicao');
        const kConfig  = findKey('configuracao', 'configuração', 'config', 'composicao', 'acessorio', 'observacao');

        const get = (row, key) =>
          (key !== null && row[key] !== undefined && row[key] !== null) ? row[key] : '';

        const normalized = rows
          .map((row) => ({
            data:         fmtDate(get(row, kData)),
            frota:        String(get(row, kFrota)).trim(),
            equipamento:  String(get(row, kEquip)).trim(),
            familia:      String(get(row, kFamilia)).trim(),
            cliente:      String(get(row, kCliente)).trim(),
            operador:     String(get(row, kOper)).trim(),
            status:       String(get(row, kStatus)).trim(),
            configuracao: String(get(row, kConfig)).trim(),
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
    ['Data', 'Frota', 'Equipamento', 'Familia', 'Cliente', 'Operador', 'Status', 'Configuracao'],
    ['15/01/2026', 'GD-250-250', 'Guindaste 250T', 'Guindaste', 'Eletronuclear', 'Sirlei Macedo', 'T', '250T c/ lanca 80m'],
    ['15/01/2026', 'GD-080-252', 'Guindaste 80T',  'Guindaste', 'Eletronuclear', 'Carlos Lima',   'T', '80T c/ jib'],
    ['15/01/2026', 'GD-110-240', 'Guindaste 110T', 'Guindaste', 'Vale',          'Joao Silva',    'T', '110T padrao'],
    ['15/01/2026', 'GD-180-300', 'Guindaste 180T', 'Guindaste', 'Base Maxpesa',  '',              'D', ''],
    ['15/01/2026', 'GD-220-180', 'Guindaste 220T', 'Guindaste', 'Base Maxpesa',  '',              'Corretiva', 'Aguardando pecas'],
    ['15/01/2026', 'PL-040-010', 'Plataforma 40T', 'Plataforma', 'Petrobras',    'Ana Costa',     'T', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
    { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Programacao');
  XLSX.writeFile(wb, 'template_frota_maxpesa.xlsx');
};
