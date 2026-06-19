import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FleetProvider }     from './context/FleetContext';
import { CadastrosProvider } from './context/CadastrosContext';
import Sidebar       from './components/Sidebar';
import Dashboard     from './pages/Dashboard';
import Operacional   from './pages/Operacional';
import MapView       from './components/MapView';
import Clientes      from './pages/Clientes';
import Operadores    from './pages/Operadores';
import Equipamentos  from './pages/Equipamentos';
import Importar      from './pages/Importar';

const Layout = ({ children }) => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6f8' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </main>
  </div>
);

const App = () => (
  <BrowserRouter>
    <FleetProvider>
      <CadastrosProvider>
        <Layout>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/operacional" element={<Operacional />} />
            <Route path="/mapa"        element={<MapView />} />
            <Route path="/clientes"    element={<Clientes />} />
            <Route path="/operadores"  element={<Operadores />} />
            <Route path="/equipamentos"element={<Equipamentos />} />
            <Route path="/importar"    element={<Importar />} />
          </Routes>
        </Layout>
      </CadastrosProvider>
    </FleetProvider>
  </BrowserRouter>
);

export default App;
