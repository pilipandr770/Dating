import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock, TrendingUp, User, Settings } from 'lucide-react';
import axios from 'axios';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:5000/api/payment/provider/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить статистику');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Ожидает' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', text: 'Подтверждено' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Завершено' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Отменено' }
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-orange-100 text-orange-800', text: 'Не оплачено' },
      'paid': { color: 'bg-green-100 text-green-800', text: 'Оплачено' },
      'refunded': { color: 'bg-gray-100 text-gray-800', text: 'Возвращено' },
      'failed': { color: 'bg-red-100 text-red-800', text: 'Ошибка' }
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка статистики...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-center mb-4">
            <Clock className="w-16 h-16 mx-auto mb-2" />
            <p className="text-xl font-bold">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
          >
            Вернуться на главную
          </button>
        </div>
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
            Назад
          </Link>
          <h1 className="text-xl font-bold">Статистика провайдера</h1>
          <Link to="/provider/settings" className="flex items-center text-gray-600 hover:text-gray-900">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Warning if not connected */}
        {!stats.stripe_connected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800 mb-1">
                Платежный аккаунт не настроен
              </p>
              <p className="text-xs text-yellow-700 mb-2">
                Для получения оплаты необходимо настроить платежный аккаунт
              </p>
              <button
                onClick={() => navigate('/provider/settings')}
                className="text-xs bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
              >
                Настроить сейчас
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-sm opacity-90 mb-1">Всего заработано</p>
            <p className="text-3xl font-bold">{stats.total_earnings.toLocaleString()} ₽</p>
          </div>

          {/* Pending Earnings */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Ожидает оплаты</p>
            <p className="text-3xl font-bold">{stats.pending_earnings.toLocaleString()} ₽</p>
          </div>

          {/* Total Bookings */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Всего бронирований</p>
            <p className="text-3xl font-bold">{stats.total_bookings}</p>
          </div>

          {/* Completed Bookings */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">Завершено</p>
            <p className="text-3xl font-bold">{stats.completed_bookings}</p>
          </div>
        </div>

        {/* Hourly Rate Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ваша почасовая ставка</p>
              <p className="text-3xl font-bold text-pink-600">
                {stats.hourly_rate ? `${stats.hourly_rate.toLocaleString()} ₽/ч` : 'Не установлена'}
              </p>
            </div>
            <button
              onClick={() => navigate('/provider/settings')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Изменить ставку
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Последние бронирования
            </h2>
          </div>

          <div className="p-6">
            {stats.recent_bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Пока нет бронирований</p>
                <p className="text-sm text-gray-400 mt-2">
                  Бронирования от клиентов будут отображаться здесь
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recent_bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.client_name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.booking_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-pink-600">
                          {booking.total_amount.toLocaleString()} ₽
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.duration_hours} ч × {booking.total_amount / booking.duration_hours} ₽
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.payment_status)}
                      </div>
                      <button
                        onClick={() => navigate('/bookings')}
                        className="text-sm text-pink-600 hover:text-pink-700 font-semibold"
                      >
                        Подробнее →
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Создано: {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/bookings?role=provider')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-semibold shadow-lg"
          >
            📅 Все мои бронирования
          </button>

          <button
            onClick={() => navigate('/provider/settings')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg"
          >
            ⚙️ Настройки провайдера
          </button>
        </div>
      </main>
    </div>
  );
}
