import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Activity, Heart, MessageCircle, LogIn, Shield } from 'lucide-react';
import axios from 'axios';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    fetchUsers();
  }, [currentPage, search]);

  const checkAdminAccess = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (!response.data.user.is_admin) {
        alert('Sie haben keinen Zugriff auf das Admin-Panel');
        navigate('/dashboard');
      }
    } catch (err) {
      navigate('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/admin/users?page=${currentPage}&per_page=20&search=${search}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setLoading(false);
    }
  };

  const impersonateUser = async (userId, username) => {
    if (!confirm(`Als ${username} anmelden?`)) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/impersonate/${userId}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );

      // Save new token
      localStorage.setItem('access_token', response.data.access_token);
      alert(`Sie sind jetzt als ${username} angemeldet`);
      navigate('/dashboard');
    } catch (err) {
      alert('Fehler beim Anmelden als Benutzer');
      console.error(err);
    }
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-600" />
            <h1 className="text-2xl font-bold text-pink-600">Admin-Panel</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamt Benutzer</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktiv</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active_users}</p>
                </div>
                <Activity className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Matches</p>
                  <p className="text-3xl font-bold text-pink-600">{stats.total_matches}</p>
                </div>
                <Heart className="w-10 h-10 text-pink-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nachrichten</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total_messages}</p>
                </div>
                <MessageCircle className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <main className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-4 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Suche nach E-Mail, Benutzername, Name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benutzername</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stadt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ziel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonnement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vertrauen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.email}
                      {user.is_admin && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">ADMIN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.city || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {user.goal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.subscription_plan === 'premium'
                          ? 'bg-purple-100 text-purple-800'
                          : user.subscription_plan === 'standard'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.trust_score}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.is_banned ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Gesperrt</span>
                      ) : user.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Aktiv</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Inaktiv</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => impersonateUser(user.id, user.username)}
                        className="flex items-center gap-1 px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700 transition text-xs"
                      >
                        <LogIn className="w-3 h-3" />
                        Anmelden
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <span className="px-4 py-2">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
