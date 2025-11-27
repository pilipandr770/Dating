import { useState } from 'react';
import axios from 'axios';
import RealStripePaymentModal from '../components/RealStripePayment';

export default function TestPayment() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setError('Not logged in. Please login first.');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/payment/bookings?role=client', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Bookings response:', response.data);
      setBookings(response.data.bookings);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedBooking(null);
    alert('Payment successful!');
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Payment Page</h1>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Bookings'}
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {bookings.length === 0 && !loading && !error && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p>No bookings found. Click "Fetch Bookings" to load data.</p>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Found {bookings.length} booking(s):</h2>

            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking ID:</p>
                    <p className="font-mono text-xs">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Provider:</p>
                    <p className="font-semibold">{booking.other_user?.username || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date:</p>
                    <p>{new Date(booking.booking_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration:</p>
                    <p>{booking.duration_hours} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount:</p>
                    <p className="text-2xl font-bold text-green-600">{booking.total_amount} RUB</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status:</p>
                    <p className={`font-semibold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {booking.payment_status}
                    </p>
                  </div>
                </div>

                {booking.payment_status === 'pending' && (
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    💳 Mit Stripe bezahlen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {selectedBooking && (
          <RealStripePaymentModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
