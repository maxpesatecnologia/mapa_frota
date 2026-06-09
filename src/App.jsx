import { useFleet } from './context/FleetContext';
import UploadArea   from './components/UploadArea';
import Header       from './components/Header';
import KpiBar       from './components/KpiBar';
import FilterBar    from './components/FilterBar';
import GroupedView  from './components/GroupedView';
import MapView      from './components/MapView';

const App = () => {
  const { rawData, view } = useFleet();

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
