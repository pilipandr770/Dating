import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Heart, X, MessageCircle, ArrowLeft, Star, MapPin, Sparkles, Calendar, Users, Coffee } from 'lucide-react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';

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
  const [showBookingModal, setShowBookingModal] = useState(false);

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
      'relationship': { title: 'Отношения', icon: Heart, color: 'pink' },
      'friendship': { title: 'Дружба', icon: Users, color: 'blue' },
      'intimate_services': { title: 'Платные услуги', icon: Sparkles, color: 'purple' },
      'casual': { title: 'Без обязательств', icon: Coffee, color: 'orange' }
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

  const currentUser = users[currentIndex];

  if (!category) {
    // Redirect to category selection if no category is selected
    navigate('/discover/categories');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
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
            Назад
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
            <h2 className="text-2xl font-bold mb-2">Нет больше пользователей</h2>
            <p className="text-gray-600 mb-6">
              Вы просмотрели всех доступных пользователей. Заходите позже!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Вернуться на главную
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
                    Провайдер услуг
                    {currentUser.service_verified && ' • Верифицирован'}
                    {currentUser.hourly_rate && ` • €${currentUser.hourly_rate}/час`}
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

            {/* Booking Button for Service Providers */}
            {currentUser.is_service_provider && currentUser.hourly_rate && (
              <div className="mb-6">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Забронировать встречу • {currentUser.hourly_rate.toLocaleString()} ₽/ч
                </button>
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
              <h2 className="text-3xl font-bold text-pink-600 mb-2">Это совпадение!</h2>
              <p className="text-gray-600">
                Вы и {matchedUser.first_name || matchedUser.username} понравились друг другу!
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
                Вы
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMatchModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Продолжить поиск
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
              >
                Написать сообщение
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && currentUser && (
        <BookingModal
          provider={currentUser}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(booking) => {
            setShowBookingModal(false);
            // Redirect to bookings page with new booking ID
            navigate(`/bookings?new_booking=${booking.id}`);
          }}
        />
      )}
    </div>
  );
}
