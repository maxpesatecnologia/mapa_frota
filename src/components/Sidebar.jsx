import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, Map, Upload,
  Building2, Users, Truck, ChevronDown, ChevronRight, Calendar,
  Activity, List, Tags
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/',          icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/programacao',icon: <Calendar size={18} />,       label: 'Programação' },
  { to: '/operacional',icon: <LayoutGrid size={18} />,     label: 'Mapa Operacional' },
  { to: '/mapa',      icon: <Map size={18} />,             label: 'Mapa' },
];

const CADASTROS = [
  { to: '/clientes',    icon: <Building2 size={16} />, label: 'Clientes' },
  { to: '/operadores',  icon: <Users size={16} />,     label: 'Operadores' },
  { to: '/equipamentos',icon: <Truck size={16} />,     label: 'Equipamentos' },
  { to: '/status',      icon: <Activity size={16} />,  label: 'Status' },
  { to: '/motivos',     icon: <List size={16} />,      label: 'Motivos de Quebra' },
  { to: '/itens-motivo',icon: <Tags size={16} />,      label: 'Itens de Motivo' },
];

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.65rem 1rem',
  margin: '0.15rem 0.5rem',
  borderRadius: 8,
  color: isActive ? '#ffffff' : '#94a3b8',
  background: isActive ? '#E30613' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.85rem',
  textDecoration: 'none',
  transition: 'all 0.15s',
  boxShadow: isActive ? '0 2px 8px rgba(227,6,19,0.35)' : 'none',
});

const Sidebar = () => {
  const [cadastrosOpen, setCadastrosOpen] = useState(true);

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#E30613',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.1rem' }}>M</span>
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>MAPA OPERACIONAL</div>
          <div style={{ fontFamily: 'Oswald', fontWeight: 500, fontSize: '0.62rem', color: '#FF6A00', letterSpacing: '2px' }}>FROTA MAXPESA</div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '0.75rem 0', flex: 1 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={linkStyle}>
            {icon} {label}
          </NavLink>
        ))}

        {/* Cadastros group */}
        <div style={{ margin: '0.5rem 0.5rem 0' }}>
          <button
            onClick={() => setCadastrosOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '0.5rem 0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.8px',
            }}
          >
            <span>Cadastros</span>
            {cadastrosOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {cadastrosOpen && CADASTROS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              ...linkStyle({ isActive }),
              paddingLeft: '1.25rem',
              fontSize: '0.82rem',
            })}>
              {icon} {label}
            </NavLink>
          ))}
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: '#1e293b', margin: '0.75rem 1rem' }} />

        {/* Importar */}
        <NavLink to="/importar" style={linkStyle}>
          <Upload size={18} /> Importar
        </NavLink>
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', fontSize: '0.68rem', color: '#334155' }}>
        Maxpesa © 2026
      </div>
    </aside>
  );
};

export default Sidebar;
