import { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function StripePaymentModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // Step 1: Create payment intent
      const paymentResponse = await axios.post(
        `http://localhost:5000/api/payment/bookings/${booking.id}/pay`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const { client_secret, payment_intent_id } = paymentResponse.data;

      // Step 2: For testing, we'll simulate payment success
      // In production, you would use Stripe.js to handle the actual card payment
      // const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      // const result = await stripe.confirmCardPayment(client_secret, {...});

      // Simulate successful payment (for testing)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Confirm payment with backend
      const confirmResponse = await axios.post(
        `http://localhost:5000/api/payment/bookings/${booking.id}/confirm-payment`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess(confirmResponse.data.booking);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка оплаты');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата успешна!</h2>
            <p className="text-gray-600">
              Buchung bezahlt. Der Anbieter erhält eine Benachrichtigung.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-2xl font-bold">Оплата</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-900 mb-2">Детали бронирования</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Провайдер:</strong> {booking.other_user?.first_name || booking.other_user?.username}</p>
            <p><strong>Дата:</strong> {new Date(booking.booking_date).toLocaleString('ru-RU')}</p>
            <p><strong>Длительность:</strong> {booking.duration_hours} ч</p>
            <p className="text-2xl font-bold text-green-600 mt-3">
              {booking.total_amount?.toLocaleString()} ₽
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Test Card Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🧪 Тестовый режим Stripe
            </p>
            <p className="text-xs text-blue-700">
              <strong>Тестовая карта:</strong> 4242 4242 4242 4242<br />
              <strong>Срок:</strong> Любая будущая дата<br />
              <strong>CVC:</strong> Любые 3 цифры
            </p>
          </div>

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 text-green-600" />
                Номер карты
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength="19"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок действия
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  maxLength="3"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              🔒 Оплата защищена Stripe. Данные карты передаются по безопасному соединению.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Обработка...' : `Оплатить ${booking.total_amount?.toLocaleString()} ₽`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
