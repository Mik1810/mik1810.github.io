import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

function RequireAdmin({ children }) {
  const { authLoading, authenticated } = useAuth();

  if (authLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p>Verifica accesso admin...</p>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RequireAdmin;
