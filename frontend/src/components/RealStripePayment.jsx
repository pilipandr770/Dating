import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// Получаем Stripe ключ из переменных окружения Vite
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

// Инициализация Stripe (только если ключ настроен)
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Компонент формы оплаты (внутри Elements)
function CheckoutForm({ booking, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Создаем Payment Intent при загрузке
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:5000/api/payment/bookings/${booking.id}/pay`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setClientSecret(response.data.client_secret);
      console.log('Payment Intent created:', response.data.payment_intent_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment intent');
      console.error('Error creating payment intent:', err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!clientSecret) {
      setError('Payment not initialized. Please refresh the page.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Подтверждаем оплату с помощью Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          console.log('Payment succeeded!', result.paymentIntent);

          // Подтверждаем оплату на backend
          const token = localStorage.getItem('access_token');
          const confirmResponse = await axios.post(
            `http://localhost:5000/api/payment/bookings/${booking.id}/confirm-payment`,
            {},
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          setSucceeded(true);
          setProcessing(false);

          setTimeout(() => {
            onSuccess(confirmResponse.data.booking);
          }, 2000);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      setProcessing(false);
      console.error('Payment error:', err);
    }
  };

  if (succeeded) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">
          Your booking has been paid. The provider will be notified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Booking Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Provider:</strong> {booking.other_user?.first_name || booking.other_user?.username}</p>
          <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleString('ru-RU')}</p>
          <p><strong>Duration:</strong> {booking.duration_hours} hours</p>
          <p className="text-2xl font-bold text-green-600 mt-3">
            {booking.total_amount?.toLocaleString()} ₽
          </p>
        </div>
      </div>

      {/* Test Card Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-semibold mb-2">
          🧪 Test Mode - Use Test Card
        </p>
        <p className="text-xs text-blue-700">
          <strong>Card Number:</strong> 4242 4242 4242 4242<br />
          <strong>Expiry:</strong> Any future date (e.g. 12/25)<br />
          <strong>CVC:</strong> Any 3 digits
        </p>
      </div>

      {/* Stripe Card Element */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          Card Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Security Info */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          🔒 Secured by Stripe. Your card details are encrypted.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 font-semibold"
        >
          {processing ? 'Processing...' : `Pay ${booking.total_amount?.toLocaleString()} ₽`}
        </button>
      </div>
    </form>
  );
}

// Компонент симуляции оплаты (когда Stripe не настроен)
function SimulatedPaymentForm({ booking, onSuccess, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);

  const handleSimulatedPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      // Создаем Payment Intent на бэкенде
      await axios.post(
        `http://localhost:5000/api/payment/bookings/${booking.id}/pay`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Симулируем задержку обработки платежа
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Подтверждаем оплату (в тестовом режиме)
      const confirmResponse = await axios.post(
        `http://localhost:5000/api/payment/bookings/${booking.id}/confirm-payment-test`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSucceeded(true);
      setTimeout(() => {
        onSuccess(confirmResponse.data.booking);
      }, 1500);

    } catch (err) {
      console.error('Simulated payment error:', err);
      setError(err.response?.data?.error || 'Ошибка оплаты');
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата успешна!</h2>
        <p className="text-gray-600">
          Бронирование оплачено. Провайдер получит уведомление.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Booking Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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

      {/* Test Mode Info */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 font-semibold mb-2">
          🧪 Тестовый режим оплаты
        </p>
        <p className="text-xs text-yellow-700">
          Stripe настроен в тестовом режиме. Реальные деньги не списываются.
        </p>
      </div>

      {/* Security Info */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          🔒 Безопасная тестовая оплата
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSimulatedPayment}
          disabled={processing}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Обработка...
            </>
          ) : (
            `Оплатить ${booking.total_amount?.toLocaleString()} ₽`
          )}
        </button>
      </div>
    </div>
  );
}

// Главный компонент модалки
export default function RealStripePaymentModal({ booking, onClose, onSuccess }) {
  // Проверяем наличие Stripe publishable key
  const hasStripeKey = STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_');

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

        {/* Выбираем форму в зависимости от наличия Stripe ключа */}
        {hasStripeKey && stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm booking={booking} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        ) : (
          <SimulatedPaymentForm booking={booking} onSuccess={onSuccess} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
