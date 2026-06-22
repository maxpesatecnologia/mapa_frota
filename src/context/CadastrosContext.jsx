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
    const { data } = await supabase.from('programacao').select('*').order('data', { ascending: false });
    if (data) setProgramacoes(data);
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
    loadClientes();
    loadOperadores();
    loadEquipamentos();
    loadProgramacoes();
    loadStatus();
    loadMotivos();
    loadItensMotivo();
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
  const saveProgramacao = async (form, id) => {
    if (id) {
      const { error } = await supabase.from('programacao').update(form).eq('id', id);
      if (!error) await loadProgramacoes();
      return !error;
    }
    const { error } = await supabase.from('programacao').insert(form);
    if (!error) await loadProgramacoes();
    return !error;
  };
  const deleteProgramacao = async (id) => {
    const { error } = await supabase.from('programacao').delete().eq('id', id);
    if (!error) await loadProgramacoes();
    return !error;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const toInsert = parsedData.map(d => ({
        user_id: session.user.id,
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
        km_inicial: d.hor_km_inicio,
        km_final: d.hor_km_final,
        km_total: d.hor_km_total
      }));

      const { error } = await supabase.from('programacao').insert(toInsert);
      if (error) throw error;
      
      await loadCadastros();
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
      await loadCadastros();
    } catch (e) {
      console.error('Erro ao limpar programacao:', e);
      throw e;
    }
  };

  return (
    <CadastrosContext.Provider value={{
      clientes, operadores, equipamentos, programacoes, statusList, motivosList, itensMotivoList,
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
    }}>
      {children}
    </CadastrosContext.Provider>
  );
};

export const useCadastros = () => useContext(CadastrosContext);
