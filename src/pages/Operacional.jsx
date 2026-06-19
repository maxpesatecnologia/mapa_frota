import { useFleet } from '../context/FleetContext';
import KpiBar      from '../components/KpiBar';
import FilterBar   from '../components/FilterBar';
import GroupedView from '../components/GroupedView';
import { Truck }   from 'lucide-react';

const Operacional = () => {
  const { rawData } = useFleet();

  if (rawData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem' }}>
        <Truck size={48} color="#e2e8f0" />
        <h3 style={{ color: '#94a3b8' }}>Nenhum dado disponível</h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Acesse Importar para adicionar dados da frota.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <KpiBar />
      <FilterBar />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <GroupedView />
      </div>
    </div>
  );
};

export default Operacional;
