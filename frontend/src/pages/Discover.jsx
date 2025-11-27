import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Heart, X, MessageCircle, ArrowLeft, Star, MapPin, Sparkles, Calendar, Users, Coffee } from 'lucide-react';
import axios from 'axios';

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    booking_date: '',
    booking_time: '',
    duration_hours: 1,
    location: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (category) {
      fetchPotentialMatches();
    }
  }, [category]);

  const fetchPotentialMatches = async () => {
    try {
      setLoading(true);
      const url = category
        ? `http://localhost:5000/api/match/discover?category=${category}`
        : 'http://localhost:5000/api/match/discover';

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setUsers(response.data.users);
      setLoading(false);
    } catch (err) {
      setError('Failed to load matches');
      setLoading(false);
    }
  };

  const getCategoryInfo = () => {
    const categories = {
      'relationship': { title: 'Beziehungen', icon: Heart, color: 'pink' },
      'friendship': { title: 'Freundschaft', icon: Users, color: 'blue' },
      'intimate_services': { title: 'Bezahlte Dienstleistungen', icon: Sparkles, color: 'purple' },
      'casual': { title: 'Ohne Verpflichtungen', icon: Coffee, color: 'orange' }
    };
    return categories[category] || categories['relationship'];
  };

  const handleLike = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/match/like',
        { user_id: currentUser.id },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.data.is_match) {
        // Show match modal
        setMatchedUser(currentUser);
        setShowMatchModal(true);
      }

      // Move to next user
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error('Failed to like user:', err);
    }
  };

  const handlePass = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      await axios.post(
        'http://localhost:5000/api/match/pass',
        { user_id: currentUser.id },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      // Move to next user
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error('Failed to pass user:', err);
      // Still move to next user even if request failed
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    console.log('[DISCOVER BOOKING] Form submitted!');
    console.log('[DISCOVER BOOKING] Form data:', bookingFormData);
    console.log('[DISCOVER BOOKING] Provider ID:', currentUser?.id);

    setBookingLoading(true);

    try {
      // Combine date and time
      const bookingDateTime = new Date(`${bookingFormData.booking_date}T${bookingFormData.booking_time}`);
      console.log('[DISCOVER BOOKING] Booking date time:', bookingDateTime.toISOString());

      const token = localStorage.getItem('access_token');
      const payload = {
        provider_id: currentUser.id,
        booking_date: bookingDateTime.toISOString(),
        duration_hours: parseFloat(bookingFormData.duration_hours),
        location: bookingFormData.location,
        notes: bookingFormData.notes
      };

      console.log('[DISCOVER BOOKING] Sending POST request to backend...');
      const response = await axios.post(
        'http://localhost:5000/api/payment/bookings',
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('[DISCOVER BOOKING] SUCCESS! Booking created:', response.data);
      
      // Reset form
      setBookingFormData({
        booking_date: '',
        booking_time: '',
        duration_hours: 1,
        location: '',
        notes: ''
      });
      setShowBookingForm(false);
      
      // Redirect to bookings page
      navigate(`/bookings?new_booking=${response.data.booking.id}`);
      
    } catch (err) {
      console.error('[DISCOVER BOOKING] ERROR:', err);
      alert(err.response?.data?.error || 'Fehler beim Erstellen der Buchung');
    } finally {
      setBookingLoading(false);
    }
  };

  const calculateBookingTotal = () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return '0';
    return (bookingFormData.duration_hours * currentUser.hourly_rate).toLocaleString();
  };

  const currentUser = users[currentIndex];

  if (!category) {
    // Redirect to category selection if no category is selected
    navigate('/discover/categories');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/discover/categories" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <div className="flex items-center gap-2">
            <CategoryIcon className={`w-5 h-5 text-${categoryInfo.color}-600`} />
            <h1 className="text-xl font-bold text-gray-900">{categoryInfo.title}</h1>
          </div>
          <Link to="/matches" className="flex items-center text-gray-600 hover:text-gray-900">
            <MessageCircle className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!currentUser ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Sparkles className="w-16 h-16 text-pink-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Keine weiteren Benutzer</h2>
            <p className="text-gray-600 mb-6">
              Du hast alle verfügbaren Benutzer durchgesehen. Komm später wieder!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Zurück zur Startseite
            </button>
          </div>
        ) : (
          <>
            {/* User Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
              {/* Photos Carousel */}
              <div
                className="relative h-96 bg-gray-200 cursor-pointer"
                onClick={() => navigate(`/profile/${currentUser.id}`)}
              >
                {currentUser.photos && currentUser.photos.length > 0 ? (
                  <img
                    src={currentUser.photos[0]}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200">
                    <span className="text-6xl text-white font-bold">
                      {currentUser.first_name?.[0] || currentUser.username[0]}
                    </span>
                  </div>
                )}

                {/* Trust Score Badge */}
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="font-semibold">{currentUser.trust_score}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-2">
                  {currentUser.first_name || currentUser.username}, {currentUser.age}
                </h2>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{currentUser.city}</span>
                </div>

                {currentUser.bio && (
                  <p className="text-gray-700 mb-4">{currentUser.bio}</p>
                )}

                {/* Service Provider Badge */}
                {currentUser.is_service_provider && (
                  <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Dienstleister
                    {currentUser.service_verified && ' • Verifiziert'}
                    {currentUser.hourly_rate && ` • €${currentUser.hourly_rate}/Std`}
                  </div>
                )}

                {/* Photo Count Indicator */}
                {currentUser.photos && currentUser.photos.length > 1 && (
                  <div className="flex gap-1 mb-4">
                    {currentUser.photos.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded ${
                          index === 0 ? 'bg-pink-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Section for Service Providers */}
            {currentUser.is_service_provider && currentUser.hourly_rate && currentUser.hourly_rate > 0 && (
              <div className="mb-6">
                {!showBookingForm ? (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Termin buchen • {currentUser.hourly_rate.toLocaleString()} €/Std
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="w-full bg-gray-500 text-white py-4 rounded-xl hover:bg-gray-600 transition font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Buchung abbrechen
                  </button>
                )}

                {/* Inline Booking Form */}
                {showBookingForm && (
                  <div className="mt-4 p-4 bg-white rounded-xl border shadow-lg">
                    <h3 className="text-lg font-bold mb-3 text-center">Termin vereinbaren</h3>
                    <form onSubmit={handleBookingSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Datum
                          </label>
                          <input
                            type="date"
                            value={bookingFormData.booking_date}
                            onChange={(e) => setBookingFormData({...bookingFormData, booking_date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Uhrzeit
                          </label>
                          <input
                            type="time"
                            value={bookingFormData.booking_time}
                            onChange={(e) => setBookingFormData({...bookingFormData, booking_time: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dauer
                        </label>
                        <select
                          value={bookingFormData.duration_hours}
                          onChange={(e) => setBookingFormData({...bookingFormData, duration_hours: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        >
                          <option value={1}>1 Stunde</option>
                          <option value={2}>2 Stunden</option>
                          <option value={3}>3 Stunden</option>
                          <option value={4}>4 Stunden</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ort
                        </label>
                        <input
                          type="text"
                          value={bookingFormData.location}
                          onChange={(e) => setBookingFormData({...bookingFormData, location: e.target.value})}
                          placeholder="z.B. Hotel, Wohnung..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Gesamt:</span>
                          <span className="text-pink-600">{calculateBookingTotal()} €</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition disabled:opacity-50 font-semibold text-sm"
                      >
                        {bookingLoading ? 'Wird gebucht...' : 'Buchen'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                onClick={handlePass}
                className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition transform"
              >
                <X className="w-8 h-8 text-red-500" />
              </button>

              <button
                onClick={handleLike}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl flex items-center justify-center hover:scale-110 transition transform"
              >
                <Heart className="w-10 h-10 text-white fill-white" />
              </button>
            </div>

            {/* Counter */}
            <div className="text-center mt-6 text-gray-600">
              {currentIndex + 1} / {users.length}
            </div>
          </>
        )}
      </main>

      {/* Match Modal */}
      {showMatchModal && matchedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-bounce-in">
            <div className="mb-6">
              <div className="text-6xl mb-4">💕</div>
              <h2 className="text-3xl font-bold text-pink-600 mb-2">Das ist ein Match!</h2>
              <p className="text-gray-600">
                Du und {matchedUser.first_name || matchedUser.username} habt euch gegenseitig geliked!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                {matchedUser.photos?.[0] ? (
                  <img src={matchedUser.photos[0]} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 text-white font-bold text-2xl">
                    {matchedUser.first_name?.[0] || matchedUser.username[0]}
                  </div>
                )}
              </div>
              <Heart className="w-8 h-8 text-pink-600 fill-pink-600" />
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-white font-bold text-2xl">
                Du
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMatchModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Weitersuchen
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
              >
                Nachricht schreiben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
