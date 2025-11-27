import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, X } from 'lucide-react';
import axios from 'axios';

export default function Likes() {
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchLikes();
  }, []);

  const fetchLikes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/match/likes/incoming', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      setLikes(response.data.likes);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch likes:', err);
      setLoading(false);
    }
  };

  const handleLikeBack = async (userId) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/match/like',
        { user_id: userId },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );

      if (response.data.is_match) {
        alert('🎉 Das ist ein Match! Jetzt können Sie chatten');
      }

      // Move to next
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error('Failed to like back:', err);
      alert('Fehler beim Senden des Likes');
    }
  };

  const handlePass = async (userId) => {
    try {
      await axios.post(
        'http://localhost:5000/api/match/pass',
        { user_id: userId },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error('Failed to pass:', err);
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
  }

  const currentLike = likes[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600" />
            <h1 className="text-2xl font-bold text-pink-600">Sie haben gefallen</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[80vh]">
        {likes.length === 0 ? (
          <div className="text-center">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Noch keine Likes</h2>
            <p className="text-gray-500 mb-6">
              Wenn jemand Ihr Profil mag, sehen Sie es hier
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
            >
              Matches suchen
            </button>
          </div>
        ) : currentIndex >= likes.length ? (
          <div className="text-center">
            <Heart className="w-24 h-24 text-pink-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Sie haben alle Likes angesehen!</h2>
            <p className="text-gray-500 mb-6">
              Überprüfen Sie später oder suchen Sie neue Matches
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/discover')}
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                Matches suchen
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Meine Matches
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* Progress */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} von {likes.length}
              </span>
              <Heart className="w-5 h-5 text-pink-600 animate-pulse" />
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Photo */}
              <div className="relative h-96 bg-gradient-to-br from-pink-200 to-purple-200">
                {currentLike.user.photos && currentLike.user.photos.length > 0 ? (
                  <img
                    src={currentLike.user.photos[0]}
                    alt={currentLike.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                    {currentLike.user.username[0].toUpperCase()}
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-pink-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="font-bold">Sie haben Ihnen gefallen!</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentLike.user.first_name || currentLike.user.username}, {currentLike.user.age}
                </h2>
                <p className="text-gray-600 mb-4">
                  📍 {currentLike.user.city} • 🎯 {currentLike.user.goal}
                </p>

                {currentLike.user.bio && (
                  <p className="text-gray-700 mb-4">{currentLike.user.bio}</p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Trust Score:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    currentLike.user.trust_score >= 70 ? 'bg-green-100 text-green-800' :
                    currentLike.user.trust_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentLike.user.trust_score}
                  </span>
                </div>

                {currentLike.user.is_service_provider && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      💼 Dienstleister
                      {currentLike.user.service_verified && ' • ✓ Verifiziert'}
                      {currentLike.user.hourly_rate && ` • ${currentLike.user.hourly_rate}€/Std.`}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handlePass(currentLike.user.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold"
                  >
                    <X className="w-6 h-6" />
                    Überspringen
                  </button>
                  <button
                    onClick={() => handleLikeBack(currentLike.user.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition font-bold shadow-lg"
                  >
                    <Heart className="w-6 h-6 fill-current" />
                    Like zurück
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
