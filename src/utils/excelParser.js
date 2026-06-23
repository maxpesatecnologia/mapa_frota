import * as XLSX from 'xlsx';

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

const fmtTime = (v) => {
  if (v === undefined || v === null || v === '') return '';
  if (v instanceof Date) {
    const h = String(v.getHours()).padStart(2, '0');
    const m = String(v.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof v === 'number') {
    const totalMins = Math.round(v * 24 * 60);
    const h = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const m = String(totalMins % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(v).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.substring(0, 5);
  return s;
};

const toIsoDate = (v) => {
  if (!v) return '';
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  const parts = s.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  return '';
};

const str = (v) => (v !== undefined && v !== null) ? String(v).trim() : '';
const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
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

        const rawKeys = Object.keys(rows[0]);
        const keyMap = {};
        rawKeys.forEach((k) => { keyMap[norm(k)] = k; });

        const findKey = (...aliases) => {
          for (const alias of aliases) {
            const found = keyMap[norm(alias)];
            if (found !== undefined) return found;
          }
          return null;
        };

        const get = (row, key) =>
          (key !== null && row[key] !== undefined && row[key] !== null) ? row[key] : '';

        const kData     = findKey('data', 'dt', 'date', 'data programacao', 'dataprog');
        const kMes      = findKey('mes', 'month', 'mês');
        const kDia      = findKey('dia', 'day');
        const kPlaca    = findKey('placa', 'frota', 'n frota', 'numero frota', 'nfrota', 'cod frota', 'equipamento id');
        const kEquip    = findKey('equipamento', 'equip', 'descricao', 'desc', 'maquina', 'descequipamento');
        const kFamilia  = findKey('familia', 'tipo', 'categoria', 'tipoequip', 'tipo equipamento', 'classe');
        const kFrota    = findKey('frota', 'n frota', 'numero frota', 'nfrota');
        const kStatus   = findKey('status', 'situacao', 'situação', 'estado', 'condicao');
        const kCliente  = findKey('cliente', 'clientes', 'local', 'obra', 'contrato', 'nome cliente', 'nomecliente');
        const kConfig   = findKey('configuracao', 'configuração', 'config', 'config equipamento', 'configuracaoequipamento', 'composicao', 'acessorio', 'observacao');
        const kOper     = findKey('operador', 'operadores', 'nome operador', 'nomeoperador', 'motorista', 'condutor', 'colaborador');
        const kParte    = findKey('parte diaria', 'partediaria', 'parte', 'num parte', 'numeroparte');
        const kInicio   = findKey('inicio da operacao', 'iniciodaoperacao', 'inicio operacao', 'inicio', 'hora inicio');
        const kIntervalo= findKey('intervalo', 'pausa', 'almoco', 'descanso');
        const kFim      = findKey('fim da operacao', 'fimdaoperacao', 'fim operacao', 'fim', 'hora fim', 'termino');
        const kTotalH   = findKey('total de horas', 'totaldehoras', 'total horas', 'horas trabalhadas', 'horastrabalhadas');
        const kQuebra   = findKey('houve quebra', 'houvequebra', 'quebra', 'falha', 'parada');
        const kMotivo   = findKey('motivo', 'motivo parada', 'motivoparada', 'causa');
        const kItem     = findKey('item do motivo', 'itemdomotivo', 'item motivo', 'item', 'componente');
        const kHoraPar  = findKey('horas paradas', 'horasparadas', 'hrs paradas', 'tempo parado');
        const kHorIni   = findKey('hor km inicio', 'horkmini', 'horim', 'horimetro inicio', 'km inicio', 'hor inicio', 'km inicial', 'kminicial');
        const kHorFim   = findKey('hor km final', 'horkmfinal', 'horfim', 'horimetro final', 'km final', 'hor final', 'km final', 'kmfinal');
        const kHorTot   = findKey('hor km total', 'horkmtotal', 'hortotal', 'km total', 'horimetro total', 'km total', 'kmtotal');

        const normalized = rows
          .map((row) => {
            const rawDate = get(row, kData);
            let ini = fmtTime(get(row, kInicio));
            let fim = fmtTime(get(row, kFim));
            let inter = fmtTime(get(row, kIntervalo));
            let th = fmtTime(get(row, kTotalH));

            if (!th && ini && fim) {
              const timeToMins = (t) => {
                if (!t) return 0;
                const [h, m] = t.split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
              };
              let diff = timeToMins(fim) - timeToMins(ini);
              if (diff < 0) diff += 24 * 60;
              diff -= timeToMins(inter);
              if (diff > 0) {
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                th = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              }
            }

            return {
              data:              fmtDate(rawDate),
              iso_date:          toIsoDate(rawDate),
              mes:               str(get(row, kMes)),
              dia:               str(get(row, kDia)),
              placa:             str(get(row, kPlaca)),
              equipamento:       str(get(row, kEquip)),
              familia:           str(get(row, kFamilia)),
              frota:             str(get(row, kFrota)) || str(get(row, kPlaca)),
              status:            str(get(row, kStatus)),
              cliente:           str(get(row, kCliente)),
              config_equipamento:str(get(row, kConfig)),
              operador:          str(get(row, kOper)),
              parte_diaria:      str(get(row, kParte)),
              inicio_operacao:   ini,
              intervalo:         inter,
              fim_operacao:      fim,
              total_horas:       th,
              houve_quebra:      str(get(row, kQuebra)),
              motivo:            str(get(row, kMotivo)),
              item_motivo:       str(get(row, kItem)),
              horas_paradas:     fmtTime(get(row, kHoraPar)),
              hor_km_inicio:     num(get(row, kHorIni)),
              hor_km_final:      num(get(row, kHorFim)),
              hor_km_total:      num(get(row, kHorTot)),
            };
          })
          .filter((r) => r.placa || r.frota);

        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });

export const exportToExcel = (data, fileName = 'frota_export.xlsx') => {
  const headers = [
    'Data', 'Mês', 'Dia', 'Placa', 'Equipamento', 'Família', 'Frota',
    'Status', 'Cliente', 'Config. Equipamento', 'Operador', 'Parte Diária',
    'Início da Operação', 'Intervalo', 'Fim da Operação', 'Total de Horas',
    'Houve Quebra', 'Motivo', 'Item do Motivo', 'Horas Paradas',
    'Hor-Km Início', 'Hor-Km Final', 'Hor-Km Total',
  ];

  const rows = data.map(r => [
    r.data, r.mes, r.dia, r.placa, r.equipamento, r.familia, r.frota,
    r.status, r.cliente, r.config_equipamento, r.operador, r.parte_diaria,
    r.inicio_operacao, r.intervalo, r.fim_operacao, r.total_horas,
    r.houve_quebra, r.motivo, r.item_motivo, r.horas_paradas,
    r.hor_km_inicio, r.hor_km_final, r.hor_km_total,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Frota');
  XLSX.writeFile(wb, fileName);
};

export const generateTemplate = () => {
  const headers = [
    'Data', 'Mês', 'Dia', 'Placa', 'Equipamento', 'Família', 'Frota',
    'Status', 'Cliente', 'Config. Equipamento', 'Operador', 'Parte Diária',
    'Início da Operação', 'Intervalo', 'Fim da Operação', 'Total de Horas',
    'Houve Quebra', 'Motivo', 'Item do Motivo', 'Horas Paradas',
    'Hor-Km Início', 'Hor-Km Final', 'Hor-Km Total',
  ];
  const example = [
    '15/01/2026', 'Janeiro', '15', 'GD-250-250', 'Guindaste 250T', 'Guindaste', 'GD-250-250',
    'T', 'Eletronuclear', '250T c/ lança 80m', 'Sirlei Macedo', '001',
    '07:00', '12:00-13:00', '17:00', 9,
    'Não', '', '', 0,
    1250, 1259, 9,
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'template_frota_maxpesa.xlsx');
};

export const generateTemplateProgramacao = () => {
  const headers = [
    'Data', 'Placa', 'Dia', 'Equipamento', 'Família', 'Frota', 'Status', 'Cliente', 
    'Config Equipamento', 'Operador', 'Parte Diária', 'Início da Operação', 'Intervalo', 
    'Fim da Operação', 'Total de Horas', 'Houve Quebra', 'Motivo', 'Item do Motivo', 
    'Horas Paradas', 'KM Inicial', 'KM Final', 'KM Total'
  ];
  const example = [
    '15/01/2026', 'ABC-1234', 'Quinta-feira', 'Escavadeira', 'Linha Amarela', 'Frota Própria', 'Disponível', 'Vale',
    'Padrão', 'João Silva', '001', '08:00', '01:00',
    '17:00', '08:00', 'Não', '', '',
    '', 1000, 1100, 100
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Programacao');
  XLSX.writeFile(wb, 'template_programacao_maxpesa.xlsx');
};

export const exportToExcelProgramacao = (data, fileName = 'programacao_export.xlsx') => {
  const headers = [
    'Data', 'Placa', 'Dia', 'Equipamento', 'Família', 'Frota', 'Status', 'Cliente', 
    'Config Equipamento', 'Operador', 'Parte Diária', 'Início da Operação', 'Intervalo', 
    'Fim da Operação', 'Total de Horas', 'Houve Quebra', 'Motivo', 'Item do Motivo', 
    'Horas Paradas', 'KM Inicial', 'KM Final', 'KM Total'
  ];
  const rows = data.map(r => [
    r.data ? new Date(r.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '', r.placa, r.dia, r.equipamento, r.familia, r.frota, r.status, r.cliente,
    r.config_equipamento, r.operador, r.parte_diaria, r.inicio_operacao, r.intervalo,
    r.fim_operacao, r.total_horas, r.houve_quebra ? 'Sim' : 'Não', r.motivo, r.item_motivo,
    r.horas_paradas, r.km_inicial, r.km_final, r.km_total
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Programacao');
  XLSX.writeFile(wb, fileName);
};
