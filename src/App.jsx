import { useFleet } from './context/FleetContext';
import UploadArea   from './components/UploadArea';
import Header       from './components/Header';
import KpiBar       from './components/KpiBar';
import FilterBar    from './components/FilterBar';
import GroupedView  from './components/GroupedView';
import MapView      from './components/MapView';

const App = () => {
  const { rawData, view, loading } = useFleet();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        gap: '1rem',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#E30613',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.5rem' }}>M</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Carregando dados...</p>
      </div>
    );
  }

  if (rawData.length === 0) {
    return <UploadArea />;
  }

  const contentH = 'calc(100vh - var(--header-h) - var(--kpi-h) - var(--filter-h))';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <KpiBar />
      <FilterBar />
      <main style={{ flex: 1, height: contentH, overflow: 'hidden' }}>
        {view === 'cards' ? <GroupedView /> : <MapView />}
      </main>
    </div>
  );
};

export default App;
