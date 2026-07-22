import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CadastrosContext = createContext(null);

export const CadastrosProvider = ({ children }) => {
  const [clientes,    setClientes]    = useState([]);
  const [operadores,  setOperadores]  = useState([]);
  const [equipamentos,setEquipamentos]= useState([]);
  const [programacoes,setProgramacoes]= useState([]);
  const [statusList,  setStatusList]  = useState([]);
  const [motivosList, setMotivosList] = useState([]);
  const [itensMotivoList, setItensMotivoList] = useState([]);
  const [anexosByProg, setAnexosByProg] = useState({});

  const loadClientes    = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('nome');
    if (data) setClientes(data);
  }, []);

  const loadOperadores  = useCallback(async () => {
    const { data } = await supabase.from('operadores').select('*').order('nome');
    if (data) setOperadores(data);
  }, []);

  const loadEquipamentos= useCallback(async () => {
    const { data } = await supabase.from('equipamentos').select('*').order('placa');
    if (data) setEquipamentos(data);
  }, []);

  const loadProgramacoes= useCallback(async () => {
    const allData = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('programacao')
        .select('*')
        .order('data', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + step - 1);

      if (error) {
        console.error('Erro loadProgramacoes:', error.message);
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
    setProgramacoes(allData);
    return allData;
  }, []);

  const loadStatus = useCallback(async () => {
    const { data } = await supabase.from('status_programacao').select('*').order('nome');
    if (data) setStatusList(data);
  }, []);

  const loadMotivos = useCallback(async () => {
    const { data } = await supabase.from('motivos').select('*').order('nome');
    if (data) setMotivosList(data);
  }, []);

  const loadItensMotivo = useCallback(async () => {
    const { data } = await supabase.from('itens_motivo').select('*').order('nome');
    if (data) setItensMotivoList(data);
  }, []);

  useEffect(() => {
    // Paraleliza todas as cargas independentes para reduzir o tempo total
    Promise.all([
      loadClientes(),
      loadOperadores(),
      loadEquipamentos(),
      loadProgramacoes(),
      loadStatus(),
      loadMotivos(),
      loadItensMotivo(),
    ]);
  }, [loadClientes, loadOperadores, loadEquipamentos, loadProgramacoes, loadStatus, loadMotivos, loadItensMotivo]);

  // CLIENTES
  const saveCliente = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('clientes').update(form).eq('id', id);
      if (!error) await loadClientes();
      return !error;
    }
    const { error } = await supabase.from('clientes').insert(form);
    if (!error) await loadClientes();
    return !error;
  };
  const deleteCliente = async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) await loadClientes();
    return !error;
  };

  // OPERADORES
  const saveOperador = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('operadores').update(form).eq('id', id);
      if (!error) await loadOperadores();
      return !error;
    }
    const { error } = await supabase.from('operadores').insert(form);
    if (!error) await loadOperadores();
    return !error;
  };
  const deleteOperador = async (id) => {
    const { error } = await supabase.from('operadores').delete().eq('id', id);
    if (!error) await loadOperadores();
    return !error;
  };

  // EQUIPAMENTOS
  const saveEquipamento = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('equipamentos').update(form).eq('id', id);
      if (!error) await loadEquipamentos();
      return !error;
    }
    const { error } = await supabase.from('equipamentos').insert(form);
    if (!error) await loadEquipamentos();
    return !error;
  };
  const deleteEquipamento = async (id) => {
    const { error } = await supabase.from('equipamentos').delete().eq('id', id);
    if (!error) await loadEquipamentos();
    return !error;
  };

  // PROGRAMACAO
  // Edições pontuais (inline ou via formulário) atualizam só o registro afetado no estado local,
  // em vez de recarregar as ~14 mil linhas da tabela a cada save — isso é o que travava a tela.
  const sortByDataDesc = (arr) => [...arr].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  const saveProgramacao = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('programacao').update(form).eq('id', id);
      if (!error) {
        setProgramacoes(prev => sortByDataDesc(prev.map(p => p.id === id ? { ...p, ...form } : p)));
      }
      return !error;
    }
    const { data, error } = await supabase.from('programacao').insert(form).select().single();
    if (!error) {
      setProgramacoes(prev => sortByDataDesc([data, ...prev]));
      return data;
    }
    return null;
  };
  const deleteProgramacao = async (id) => {
    const { error } = await supabase.from('programacao').delete().eq('id', id);
    if (!error) {
      setProgramacoes(prev => prev.filter(p => p.id !== id));
      setAnexosByProg(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    return !error;
  };

  // ANEXOS
  const loadAnexos = useCallback(async (programacaoId) => {
    if (!programacaoId) return [];
    const { data } = await supabase
      .from('programacao_anexos')
      .select('*')
      .eq('programacao_id', programacaoId)
      .order('created_at', { ascending: true });
    const lista = data || [];
    setAnexosByProg(prev => ({ ...prev, [programacaoId]: lista }));
    return lista;
  }, []);

  // Carrega anexos de várias programações de uma vez (ex: página atual da tabela)
  const loadAnexosBulk = useCallback(async (programacaoIds) => {
    const ids = [...new Set(programacaoIds)].filter(Boolean);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('programacao_anexos')
      .select('*')
      .in('programacao_id', ids)
      .order('created_at', { ascending: true });
    const grouped = Object.fromEntries(ids.map(id => [id, []]));
    (data || []).forEach(a => { grouped[a.programacao_id]?.push(a); });
    setAnexosByProg(prev => ({ ...prev, ...grouped }));
  }, []);

  const uploadAnexo = async (file, programacaoId) => {
    const ext = file.name.split('.').pop();
    // Limpar o nome do arquivo: remover acentos, trocar espaços e caracteres especiais por underscore
    const cleanName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_');
      
    const path = `${programacaoId}/${Date.now()}_${cleanName}`;
    const { error: upErr } = await supabase.storage
      .from('programacao-anexos')
      .upload(path, file, { upsert: false });
    if (upErr) throw upErr;

    const { data: pubData } = supabase.storage
      .from('programacao-anexos')
      .getPublicUrl(path);

    const registro = {
      programacao_id: programacaoId,
      nome_arquivo: file.name,
      storage_path: path,
      tipo_arquivo: ext.toLowerCase(),
      tamanho_bytes: file.size,
    };
    const { data, error } = await supabase.from('programacao_anexos').insert(registro).select().single();
    if (error) throw error;
    await loadAnexos(programacaoId);
    return { ...data, url: pubData.publicUrl };
  };

  const deleteAnexo = async (anexo) => {
    await supabase.storage.from('programacao-anexos').remove([anexo.storage_path]);
    const { error } = await supabase.from('programacao_anexos').delete().eq('id', anexo.id);
    if (!error) await loadAnexos(anexo.programacao_id);
    return !error;
  };

  const getAnexoUrl = (storagePath) => {
    const { data } = supabase.storage.from('programacao-anexos').getPublicUrl(storagePath);
    return data?.publicUrl || '';
  };

  // STATUS
  const saveStatus = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('status_programacao').update(form).eq('id', id);
      if (!error) await loadStatus();
      return !error;
    }
    const { error } = await supabase.from('status_programacao').insert(form);
    if (!error) await loadStatus();
    return !error;
  };
  const deleteStatus = async (id) => {
    const { error } = await supabase.from('status_programacao').delete().eq('id', id);
    if (!error) await loadStatus();
    return !error;
  };

  // MOTIVOS
  const saveMotivo = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('motivos').update(form).eq('id', id);
      if (!error) await loadMotivos();
      return !error;
    }
    const { error } = await supabase.from('motivos').insert(form);
    if (!error) await loadMotivos();
    return !error;
  };
  const deleteMotivo = async (id) => {
    const { error } = await supabase.from('motivos').delete().eq('id', id);
    if (!error) await loadMotivos();
    return !error;
  };

  // ITENS DE MOTIVO
  const saveItemMotivo = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('itens_motivo').update(form).eq('id', id);
      if (!error) await loadItensMotivo();
      return !error;
    }
    const { error } = await supabase.from('itens_motivo').insert(form);
    if (!error) await loadItensMotivo();
    return !error;
  };
  const deleteItemMotivo = async (id) => {
    const { error } = await supabase.from('itens_motivo').delete().eq('id', id);
    if (!error) await loadItensMotivo();
    else {
      console.error(error);
    }
  };

  const importProgramacaoExcel = async (parsedData) => {
    try {
      const { error: delError } = await supabase
        .from('programacao')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) throw delError;

      const toInsert = parsedData.map(d => ({
        data: d.iso_date || null,
        placa: d.placa,
        dia: d.dia,
        equipamento: d.equipamento,
        familia: d.familia,
        frota: d.frota,
        status: d.status,
        cliente: d.cliente,
        config_equipamento: d.config_equipamento,
        operador: d.operador,
        parte_diaria: d.parte_diaria,
        inicio_operacao: d.inicio_operacao,
        intervalo: d.intervalo,
        fim_operacao: d.fim_operacao,
        total_horas: d.total_horas !== null ? String(d.total_horas) : null,
        houve_quebra: String(d.houve_quebra).toLowerCase() === 'sim' || String(d.houve_quebra).toLowerCase() === 'true',
        motivo: d.motivo,
        item_motivo: d.item_motivo,
        horas_paradas: d.horas_paradas !== null ? String(d.horas_paradas) : null,
        km_inicial: d.km_inicial,
        km_final: d.km_final,
        km_total: d.km_total,
        horimetro_inicial: d.horimetro_inicial,
        horimetro_final: d.horimetro_final,
        horimetro_total: d.horimetro_total,
      }));

      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('programacao').insert(chunk);
        if (error) throw error;
      }
      
      await loadProgramacoes();
      return true;
    } catch (e) {
      console.error('Erro na importação de programacao:', e);
      throw e;
    }
  };

  const clearProgramacao = async () => {
    try {
      const { error } = await supabase.from('programacao').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      await loadProgramacoes();
    } catch (e) {
      console.error('Erro ao limpar programacao:', e);
      throw e;
    }
  };

  return (
    <CadastrosContext.Provider value={{
      clientes, operadores, equipamentos, programacoes, statusList, motivosList, itensMotivoList,
      anexosByProg,
      saveCliente, deleteCliente,
      saveOperador, deleteOperador,
      saveEquipamento, deleteEquipamento,
      saveProgramacao, deleteProgramacao,
      saveStatus, deleteStatus,
      saveMotivo, deleteMotivo,
      saveItemMotivo, deleteItemMotivo,
      importProgramacaoExcel,
      clearProgramacao,
      loadClientes, loadOperadores, loadEquipamentos, loadProgramacoes,
      loadAnexos, loadAnexosBulk, uploadAnexo, deleteAnexo, getAnexoUrl,
    }}>
      {children}
    </CadastrosContext.Provider>
  );
};

export const useCadastros = () => useContext(CadastrosContext);
