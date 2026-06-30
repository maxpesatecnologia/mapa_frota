import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { FleetProvider }     from './context/FleetContext';
import { CadastrosProvider } from './context/CadastrosContext';
import Sidebar from './components/Sidebar';

// Lazy loading — cada página só é carregada quando o usuário navega até ela
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Operacional  = lazy(() => import('./pages/Operacional'));
const MapView      = lazy(() => import('./components/MapView'));
const Clientes     = lazy(() => import('./pages/Clientes'));
const Operadores   = lazy(() => import('./pages/Operadores'));
const Equipamentos = lazy(() => import('./pages/Equipamentos'));
const Status       = lazy(() => import('./pages/Status'));
const Motivos      = lazy(() => import('./pages/Motivos'));
const ItensMotivo  = lazy(() => import('./pages/ItensMotivo'));
const Programacao  = lazy(() => import('./pages/Programacao'));
const Importar     = lazy(() => import('./pages/Importar'));

const PageLoader = () => (
  <div style={{
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f4f6f8',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #e2e8f0',
        borderTop: '3px solid #E30613', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Carregando...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

const Layout = ({ children }) => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6f8' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
  </div>
);

const App = () => (
  <BrowserRouter>
    <FleetProvider>
      <CadastrosProvider>
        <Layout>
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/operacional"  element={<Operacional />} />
            <Route path="/mapa"         element={<MapView />} />
            <Route path="/clientes"     element={<Clientes />} />
            <Route path="/operadores"   element={<Operadores />} />
            <Route path="/equipamentos" element={<Equipamentos />} />
            <Route path="/status"       element={<Status />} />
            <Route path="/motivos"      element={<Motivos />} />
            <Route path="/itens-motivo" element={<ItensMotivo />} />
            <Route path="/programacao"  element={<Programacao />} />
            <Route path="/importar"     element={<Importar />} />
          </Routes>
        </Layout>
      </CadastrosProvider>
    </FleetProvider>
  </BrowserRouter>
);

export default App;

