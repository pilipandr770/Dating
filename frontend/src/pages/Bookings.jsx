import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, DollarSign, Clock, CheckCircle, XCircle, MapPin, FileText } from 'lucide-react';
import axios from 'axios';
import RealStripePaymentModal from '../components/RealStripePayment';

export default function Bookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'client';

  const [role, setRole] = useState(roleParam);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [role]);

  // Auto-open payment modal for new booking
  useEffect(() => {
    const newBookingId = searchParams.get('new_booking');
    console.log('[BOOKINGS PAGE] Checking for new_booking param:', newBookingId);
    console.log('[BOOKINGS PAGE] Current bookings count:', bookings.length);
    console.log('[BOOKINGS PAGE] Loading:', loading);
    
    if (newBookingId && bookings.length > 0 && !loading) {
      const newBooking = bookings.find(b => b.id === newBookingId);
      console.log('[BOOKINGS PAGE] Found new booking:', newBooking);
      
      if (newBooking && newBooking.payment_status === 'pending') {
        console.log('[BOOKINGS PAGE] ✅ Auto-opening payment modal for new booking:', newBookingId);
        setSelectedBookingForPayment(newBooking);
        // Remove the parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('new_booking');
        const newSearchString = newSearchParams.toString();
        navigate(`/bookings${newSearchString ? '?' + newSearchString : ''}`, { replace: true });
      } else if (newBooking && newBooking.payment_status === 'paid') {
        console.log('[BOOKINGS PAGE] Booking already paid, not opening modal');
        // Просто убираем параметр из URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('new_booking');
        navigate(`/bookings${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
      }
    }
  }, [bookings, searchParams, loading]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:5000/api/payment/bookings?role=${role}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBookings(response.data.bookings);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setLoading(false);
    }
  };

  const handlePayBooking = (booking) => {
    setSelectedBookingForPayment(booking);
  };

  const handlePaymentSuccess = (updatedBooking) => {
    setSelectedBookingForPayment(null);
    fetchBookings();
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      setProcessing(bookingId);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:5000/api/payment/bookings/${bookingId}/confirm`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка подтверждения');
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      setProcessing(bookingId);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:5000/api/payment/bookings/${bookingId}/complete`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка завершения');
    } finally {
      setProcessing(null);
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
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Ожидает', icon: Clock },
      'confirmed': { color: 'bg-blue-100 text-blue-800', text: 'Подтверждено', icon: CheckCircle },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Завершено', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Отменено', icon: XCircle }
    };
    const badge = badges[status] || badges['pending'];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-orange-100 text-orange-800', text: '💳 Не оплачено' },
      'paid': { color: 'bg-green-100 text-green-800', text: '✓ Оплачено' },
      'refunded': { color: 'bg-gray-100 text-gray-800', text: '↩ Возвращено' },
      'failed': { color: 'bg-red-100 text-red-800', text: '✗ Ошибка' }
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка бронирований...</div>
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
          <h1 className="text-xl font-bold">Мои бронирования</h1>
          <div className="w-20"></div>
        </div>

        {/* Role Toggle */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-4 flex gap-1">
            <button
              onClick={() => setRole('client')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                role === 'client'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Как клиент
            </button>

            <button
              onClick={() => setRole('provider')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                role === 'provider'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Как провайдер
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Нет бронирований</h2>
            <p className="text-gray-500 mb-6">
              {role === 'client'
                ? 'У вас пока нет бронирований. Найдите провайдера услуг и создайте бронирование!'
                : 'У вас пока нет заказов от клиентов.'}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Найти провайдеров
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Booking Header */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                        {booking.other_user?.first_name?.[0] || booking.other_user?.username?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {booking.other_user?.first_name || booking.other_user?.username || 'Неизвестно'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {role === 'client' ? 'Провайдер' : 'Клиент'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600">
                        {booking.total_amount.toLocaleString()} ₽
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.duration_hours} ч × {booking.hourly_rate} ₽/ч
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-pink-600" />
                      <div>
                        <p className="text-xs text-gray-500">Дата встречи</p>
                        <p className="font-semibold">{formatDate(booking.booking_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-pink-600" />
                      <div>
                        <p className="text-xs text-gray-500">Длительность</p>
                        <p className="font-semibold">{booking.duration_hours} ч</p>
                      </div>
                    </div>
                  </div>

                  {booking.location && (
                    <div className="flex items-start gap-2 text-gray-700 mb-3 bg-gray-50 rounded-lg p-3">
                      <MapPin className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Место встречи</p>
                        <p className="text-sm">{booking.location}</p>
                      </div>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="flex items-start gap-2 text-gray-700 mb-3 bg-gray-50 rounded-lg p-3">
                      <FileText className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Примечания</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getStatusBadge(booking.status)}
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-gray-100 pt-4">
                    {/* Client actions */}
                    {role === 'client' && booking.payment_status === 'pending' && (
                      <button
                        onClick={() => handlePayBooking(booking)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        💳 Оплатить
                      </button>
                    )}

                    {/* Provider actions */}
                    {role === 'provider' && booking.payment_status === 'paid' && booking.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmBooking(booking.id)}
                        disabled={processing === booking.id}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                      >
                        {processing === booking.id ? 'Обработка...' : '✓ Подтвердить'}
                      </button>
                    )}

                    {role === 'provider' && booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={processing === booking.id}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold"
                      >
                        {processing === booking.id ? 'Обработка...' : '✓ Завершить'}
                      </button>
                    )}
                  </div>

                  {/* Booking metadata */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Создано: {formatDate(booking.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedBookingForPayment && (
        <RealStripePaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

// Missing import
const Briefcase = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
