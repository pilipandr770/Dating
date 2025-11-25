import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, MapPin, Clock } from 'lucide-react';
import axios from 'axios';

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/match/matches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMatches(response.data.matches);
      setLoading(false);
    } catch (err) {
      setError('Failed to load matches');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Только что';
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </Link>
          <h1 className="text-2xl font-bold text-pink-600">Совпадения</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Пока нет совпадений</h2>
            <p className="text-gray-600 mb-6">
              Начните листать профили, чтобы найти свою пару!
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Начать поиск
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div
                key={match.match_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/chat/${match.match_id}`)}
              >
                {/* User Photo */}
                <div className="relative h-64 bg-gray-200">
                  {match.user.photos && match.user.photos.length > 0 ? (
                    <img
                      src={match.user.photos[0]}
                      alt={match.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200">
                      <span className="text-6xl text-white font-bold">
                        {match.user.first_name?.[0] || match.user.username[0]}
                      </span>
                    </div>
                  )}

                  {/* Match Badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center">
                    <Heart className="w-4 h-4 mr-1 fill-white" />
                    Match!
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">
                    {match.user.first_name || match.user.username}, {match.user.age}
                  </h3>

                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{match.user.city}</span>
                  </div>

                  {match.user.bio && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {match.user.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(match.matched_at)}</span>
                    </div>
                    <span className="text-pink-600 font-semibold">Trust: {match.user.trust_score}</span>
                  </div>

                  <button className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Написать сообщение
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
