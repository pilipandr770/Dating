import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch (error) {
        // If token is invalid, redirect to login
        localStorage.removeItem('access_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchLikesCount = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/match/likes/incoming', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        setLikesCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch likes count:', err);
      }
    };

    fetchUser();
    fetchLikesCount();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-600">LoveMatch</h1>
          <div className="flex items-center gap-4">
            {user?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                🛡️ Админ
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Добро пожаловать, {user?.username}!</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Ваш профиль</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Имя пользователя:</strong> {user?.username}</p>
                <p><strong>Возраст:</strong> {user?.age}</p>
                <p><strong>Город:</strong> {user?.city}</p>
                <p><strong>Цель:</strong> {user?.goal}</p>
                <p><strong>Тариф:</strong> {user?.subscription_plan}</p>
                <p><strong>Trust Score:</strong> {user?.trust_score}</p>
                {user?.is_service_provider && (
                  <>
                    <p><strong>Бизнес:</strong> {user?.business_name}</p>
                    <p><strong>Верификация:</strong> {user?.service_verified ? 'Да' : 'Ожидание'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Быстрые действия</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
                >
                  Редактировать профиль
                </button>
                <button
                  onClick={() => navigate('/discover/categories')}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Найти совпадения
                </button>
                <button
                  onClick={() => navigate('/likes')}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition relative"
                >
                  💕 Вы понравились
                  {likesCount > 0 && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      {likesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/matches')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Мои совпадения
                </button>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
                  Upgrade план
                </button>

                {user?.is_service_provider && (
                  <>
                    <button
                      onClick={() => navigate('/provider/dashboard')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"
                    >
                      📊 Статистика провайдера
                    </button>
                    <button
                      onClick={() => navigate('/provider/settings')}
                      className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-lg hover:from-pink-700 hover:to-orange-700 transition font-semibold"
                    >
                      ⚙️ Настройки провайдера
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 transition"
                >
                  📅 Мои бронирования
                </button>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {!user?.email_verified && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800">
                <strong>Внимание:</strong> Подтвердите свой email для доступа ко всем функциям
              </p>
            </div>
          )}

          {user?.is_service_provider && !user?.service_verified && (
            <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800">
                <strong>Верификация:</strong> Ваш аккаунт провайдера находится на рассмотрении
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
