import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import '../css/AdminAuth.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { authenticated, authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && authenticated) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, authenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error || 'Login fallito');
      } else {
        navigate('/admin', { replace: true });
      }
    } catch {
      setError('Errore di rete durante il login');
    }

    setLoading(false);
  };

  return (
    <main className="admin-page admin-page-login">
      <section className="admin-card">
        <h3>Admin Login</h3>
        <form className="admin-form" onSubmit={handleLogin}>
          <label className="admin-label" htmlFor="admin-email">
            Email
            <input
              className="admin-input"
              type="email"
              id="admin-email"
              name="email"
              autoComplete="username"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="admin-label" htmlFor="admin-password">
            Password
            <input
              className="admin-input"
              type="password"
              id="admin-password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="admin-btn" type="submit" disabled={loading}>
            {loading ? 'Login...' : 'Login'}
          </button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </section>
    </main>
  );
};

export default AdminLogin;
