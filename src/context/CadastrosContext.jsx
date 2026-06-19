import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CadastrosContext = createContext(null);

export const CadastrosProvider = ({ children }) => {
  const [clientes,    setClientes]    = useState([]);
  const [operadores,  setOperadores]  = useState([]);
  const [equipamentos,setEquipamentos]= useState([]);

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

  useEffect(() => {
    loadClientes();
    loadOperadores();
    loadEquipamentos();
  }, [loadClientes, loadOperadores, loadEquipamentos]);

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

  return (
    <CadastrosContext.Provider value={{
      clientes, operadores, equipamentos,
      saveCliente, deleteCliente,
      saveOperador, deleteOperador,
      saveEquipamento, deleteEquipamento,
      loadClientes, loadOperadores, loadEquipamentos,
    }}>
      {children}
    </CadastrosContext.Provider>
  );
};

export const useCadastros = () => useContext(CadastrosContext);
