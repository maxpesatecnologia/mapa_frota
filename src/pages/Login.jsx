import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await signIn(email.trim(), password);
    if (err) setError('E-mail ou senha inválidos.');
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 360, background: '#111827', borderRadius: 14,
        padding: '2.25rem 2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: '#E30613',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.5rem' }}>M</span>
          </div>
          <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
            <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>MAPA OPERACIONAL</div>
            <div style={{ fontFamily: 'Oswald', fontWeight: 500, fontSize: '0.68rem', color: '#FF6A00', letterSpacing: '2px' }}>FROTA MAXPESA</div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>E-mail</label>
          <input
            type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, boxSizing: 'border-box',
              border: '1px solid #1e293b', background: '#0f172a', color: 'white', fontSize: '0.9rem', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>Senha</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, boxSizing: 'border-box',
              border: '1px solid #1e293b', background: '#0f172a', color: 'white', fontSize: '0.9rem', outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#f87171', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          padding: '0.7rem', borderRadius: 8, border: 'none', background: '#E30613', color: 'white',
          fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          <LogIn size={16} /> {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;
