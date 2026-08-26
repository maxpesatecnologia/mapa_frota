import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, Map, Upload,
  Building2, Users, Truck, ChevronDown, ChevronRight, Calendar,
  Activity, List, Tags, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoMaxpesa from '../assets/logo-maxpesa.png';

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
  const { user, isEditor, signOut } = useAuth();

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: '#eceff3',
      borderRight: '1px solid #d8dde3',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem 1rem',
        borderBottom: '1px solid #d8dde3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexShrink: 0,
      }}>
        <img src={logoMaxpesa} alt="Grupo Maxpesa" style={{ height: 56, width: 'auto', flexShrink: 0 }} />
        <div style={{ fontFamily: 'Oswald', fontWeight: 600, fontSize: '0.75rem', color: '#0f172a', letterSpacing: '1px' }}>MAPA DA FROTA</div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '0.75rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
        <div style={{ height: 1, background: '#d8dde3', margin: '0.75rem 1rem' }} />

        {/* Importar */}
        <NavLink to="/importar" style={linkStyle}>
          <Upload size={18} /> Importar
        </NavLink>
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #d8dde3', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ fontSize: '0.65rem', color: isEditor ? '#FF6A00' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isEditor ? 'Editor' : 'Somente leitura'}
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.4rem', borderRadius: 6, border: 'none', background: '#dde2e8',
              color: '#64748b', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Maxpesa © 2026</div>
      </div>
    </aside>
  );
};

export default Sidebar;
