import { useState } from 'react';
import { X, Calendar, Clock, DollarSign, MapPin, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function BookingModal({ provider, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    duration_hours: 1,
    location: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('='.repeat(60));
    console.log('[BOOKING MODAL] ✅ Form submitted!');
    console.log('[BOOKING MODAL] Form data:', formData);
    console.log('[BOOKING MODAL] Provider ID:', provider?.id);
    console.log('[BOOKING MODAL] Provider hourly_rate:', provider?.hourly_rate);
    console.log('='.repeat(60));

    setError(null);
    setLoading(true);

    try {
      // Combine date and time
      const bookingDateTime = new Date(`${formData.booking_date}T${formData.booking_time}`);
      console.log('[BOOKING MODAL] 📅 Booking date time:', bookingDateTime.toISOString());

      const token = localStorage.getItem('access_token');
      const payload = {
        provider_id: provider.id,
        booking_date: bookingDateTime.toISOString(),
        duration_hours: parseFloat(formData.duration_hours),
        location: formData.location,
        notes: formData.notes
      };

      console.log('[BOOKING MODAL] 📤 Sending POST request to backend...');
      console.log('[BOOKING MODAL] 📦 Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        'http://localhost:5000/api/payment/bookings',
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('[BOOKING MODAL] ✅ SUCCESS! Booking created:', response.data);
      console.log('[BOOKING MODAL] 🎉 Calling onSuccess callback...');
      onSuccess(response.data.booking);
      console.log('[BOOKING MODAL] ✅ onSuccess called!');
    } catch (err) {
      console.error('='.repeat(60));
      console.error('[BOOKING MODAL] ❌ ERROR creating booking!');
      console.error('[BOOKING MODAL] Error object:', err);
      console.error('[BOOKING MODAL] Error response:', err.response?.data);
      console.error('[BOOKING MODAL] Error status:', err.response?.status);
      console.error('='.repeat(60));
      setError(err.response?.data?.error || 'Fehler beim Erstellen der Buchung');
    } finally {
      console.log('[BOOKING MODAL] 🏁 Request finished, setting loading=false');
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return (formData.duration_hours * provider.hourly_rate).toLocaleString();
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-2xl font-bold">Termin buchen</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Provider Info */}
        <div className="px-6 py-4 bg-gradient-to-br from-pink-50 to-purple-50 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
              {(() => {
                // Safe photo parsing
                let photoUrl = null;
                try {
                  if (provider.photos) {
                    const photos = typeof provider.photos === 'string' 
                      ? JSON.parse(provider.photos) 
                      : provider.photos;
                    photoUrl = Array.isArray(photos) ? photos[0] : null;
                  }
                } catch (e) {
                  console.error('[BookingModal] Error parsing photos:', e);
                }
                
                if (photoUrl) {
                  return (
                    <img
                      src={photoUrl}
                      alt={provider.username || 'Provider'}
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return (provider.first_name?.[0] || provider.username?.[0] || 'P').toUpperCase();
              })()}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {provider.first_name || provider.username || 'Провайдер'}
              </p>
              <p className="text-2xl font-bold text-pink-600">
                {provider.hourly_rate?.toLocaleString()} ₽/ч
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  Дата встречи
                </label>
                <input
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  min={getMinDate()}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 text-pink-600" />
                  Время
                </label>
                <input
                  type="time"
                  value={formData.booking_time}
                  onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-pink-600" />
                Длительность (часов)
              </label>
              <select
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12].map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} - {(hours * provider.hourly_rate).toLocaleString()} ₽
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-pink-600" />
                Место встречи (опционально)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Адрес или место встречи"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-pink-600" />
                Примечания (опционально)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительные пожелания или информация"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Total Cost */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-pink-600" />
                  <span className="text-lg font-semibold text-gray-700">Итого к оплате:</span>
                </div>
                <span className="text-3xl font-bold text-pink-600">
                  {calculateTotal()} ₽
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {formData.duration_hours} ч × {provider.hourly_rate} ₽/ч
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Обратите внимание:</strong> После создания бронирования необходимо произвести оплату.
                Провайдер сможет подтвердить встречу после получения оплаты.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Erstelle...' : 'Buchung erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
