import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import axios from 'axios';

export default function ProviderSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    tax_id: '',
    hourly_rate: '',
    services_offered: []
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const userData = response.data.user;
      setUser(userData);

      // Pre-fill form with existing data
      setFormData({
        tax_id: userData.tax_id || '',
        hourly_rate: userData.hourly_rate || '',
        services_offered: userData.services_offered || []
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setLoading(false);
    }
  };

  const handleSetupStripe = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/api/payment/provider/setup',
        { tax_id: formData.tax_id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: response.data.message });
      fetchUserData(); // Refresh user data
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка настройки аккаунта' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRate = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:5000/api/auth/update-profile',
        { hourly_rate: parseFloat(formData.hourly_rate) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Ставка обновлена успешно' });
      fetchUserData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка обновления ставки' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!user?.is_service_provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 text-center mb-6">
            Эта страница доступна только для поставщиков услуг
          </p>
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
          <h1 className="text-xl font-bold">Настройки провайдера</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* Stripe Connection Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-pink-600" />
              Статус платежного аккаунта
            </h2>
            {user.stripe_account_id ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Подключен</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Не подключен</span>
              </div>
            )}
          </div>

          {user.stripe_account_id ? (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                ✓ Ваш Stripe аккаунт подключен и готов к приему платежей
              </p>
              <p className="text-xs text-green-600">
                Account ID: {user.stripe_account_id}
              </p>
              {user.service_verified && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Верификация пройдена в Stripe
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-5 mb-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                      Как начать принимать платежи через Stripe
                    </p>
                    <ol className="text-xs text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">1.</span>
                        <div>
                          <strong>Зарегистрируйте бизнес в Stripe:</strong>
                          <br />
                          Перейдите на{' '}
                          <a
                            href="https://dashboard.stripe.com/register"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            dashboard.stripe.com/register
                          </a>
                          <br />
                          Stripe проведет полную верификацию вашего бизнеса
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">2.</span>
                        <div>
                          <strong>Получите API ключи:</strong>
                          <br />
                          После регистрации в{' '}
                          <a
                            href="https://dashboard.stripe.com/apikeys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            разделе API Keys
                          </a>
                          {' '}получите Secret Key
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">3.</span>
                        <div>
                          <strong>Введите ключ ниже:</strong>
                          <br />
                          Мы подключим ваш Stripe аккаунт к платформе
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-800">
                      <strong>Важно:</strong> Stripe проверяет легальность бизнеса, налоговые документы
                      и личность владельца. Все данные хранятся у Stripe, мы не храним
                      ваши налоговые данные.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="sk_live_... или sk_test_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ваш Secret Key безопасно хранится и используется только для обработки платежей
                </p>
              </div>

              <button
                onClick={handleSetupStripe}
                disabled={saving || !formData.tax_id}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition disabled:opacity-50 font-semibold"
              >
                {saving ? 'Подключение...' : 'Подключить Stripe аккаунт'}
              </button>

              <div className="text-center">
                <a
                  href="https://stripe.com/docs/connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Подробнее о Stripe Connect →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Hourly Rate */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-pink-600" />
            Почасовая ставка
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ставка за час (₽)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  placeholder="5000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₽/ч
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Эта ставка будет показываться клиентам при бронировании
              </p>
            </div>

            {user.hourly_rate && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Текущая ставка: <span className="font-bold">{user.hourly_rate} ₽/ч</span>
                </p>
              </div>
            )}

            <button
              onClick={handleUpdateRate}
              disabled={saving || !formData.hourly_rate}
              className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Сохранение...' : 'Обновить ставку'}
            </button>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Briefcase className="w-6 h-6 text-pink-600" />
            Предлагаемые услуги
          </h2>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Функция в разработке. Скоро вы сможете указать список услуг, которые предлагаете клиентам.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg"
          >
            📊 Статистика и заработок
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-semibold shadow-lg"
          >
            📅 Мои бронирования
          </button>
        </div>
      </main>
    </div>
  );
}
