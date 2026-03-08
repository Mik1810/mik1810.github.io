import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../css/AdminAuth.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  return (
    <main className="admin-page">
      <section className="admin-card">
        <div className="admin-card-header">
          <h3>Admin Dashboard</h3>
        </div>
        <p className="admin-user">Utente: <b>{user?.email || '-'}</b></p>
      </section>
    </main>
  );
}

export default AdminDashboard;
