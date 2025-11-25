import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Video, Image, User, MessageCircle,
  Star, MapPin, Calendar, Sparkles, Heart, X, Monitor,
  Mic, MicOff, VideoOff, Phone, FileText, Briefcase,
  GraduationCap, Wine, Cigarette, Baby, Languages, Ruler,
  Activity, Eye, Palette, Clock, ChevronLeft, ChevronRight,
  Film, Hotel, UtensilsCrossed, CreditCard, Shield, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import RealStripePaymentModal from '../components/RealStripePayment';

// Interest icons mapping
const interestIcons = {
  'travel': '✈️', 'music': '🎵', 'sport': '⚽', 'art': '🎨',
  'cinema': '🎬', 'reading': '📚', 'cooking': '👨‍🍳', 'gaming': '🎮',
  'photography': '📷', 'dancing': '💃', 'yoga': '🧘', 'fitness': '💪',
  'nature': '🌿', 'animals': '🐾', 'technology': '💻', 'fashion': '👗',
  'food': '🍕', 'wine': '🍷', 'coffee': '☕', 'nightlife': '🌃'
};

// Translations
const translations = {
  body_type: {
    slim: 'Стройное', athletic: 'Атлетичное', average: 'Среднее',
    curvy: 'Фигуристое', plus_size: 'Плюс сайз'
  },
  education: {
    high_school: 'Среднее', bachelor: 'Бакалавр', master: 'Магистр', phd: 'PhD'
  },
  smoking: {
    never: 'Не курю', sometimes: 'Иногда', regularly: 'Регулярно'
  },
  drinking: {
    never: 'Не пью', socially: 'По праздникам', regularly: 'Регулярно'
  },
  children: {
    no: 'Нет детей', yes_living_together: 'Есть, живём вместе',
    yes_living_separately: 'Есть, живут отдельно', want_someday: 'Хочу в будущем'
  },
  relationship_type: {
    serious: 'Серьёзные отношения', casual: 'Без обязательств',
    friendship: 'Дружба', not_sure: 'Ещё не определился(ась)'
  },
  zodiac_sign: {
    aries: 'Овен ♈', taurus: 'Телец ♉', gemini: 'Близнецы ♊', cancer: 'Рак ♋',
    leo: 'Лев ♌', virgo: 'Дева ♍', libra: 'Весы ♎', scorpio: 'Скорпион ♏',
    sagittarius: 'Стрелец ♐', capricorn: 'Козерог ♑', aquarius: 'Водолей ♒', pisces: 'Рыбы ♓'
  }
};

export default function ProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [matchId, setMatchId] = useState(null);

  // Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchCurrentUser();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'chat' && matchId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentUserId(response.data.user.id);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Only show loading on first load, not on updates
      if (!user) {
        setLoading(true);
      }
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:5000/api/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUser(response.data.user);
      if (response.data.match_id) {
        setMatchId(response.data.match_id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:5000/api/chat/${matchId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId) return;

    try {
      setSending(true);
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:5000/api/chat/${matchId}/messages`,
        { message: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCallActive(true);
    } catch (err) {
      console.error('Failed to start video call:', err);
      alert('Не удалось получить доступ к камере');
    }
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsCallActive(false);
  };

  const handlePaymentSuccess = () => {
    setSelectedBookingForPayment(null);
    alert('Оплата успешна!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка профиля...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-xl text-gray-600 mb-4">Пользователь не найден</div>
          <button onClick={() => navigate(-1)} className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  // Safe data extraction
  let photos = [];
  try {
    if (user.photos) {
      photos = typeof user.photos === 'string' ? JSON.parse(user.photos) : user.photos;
      if (!Array.isArray(photos)) photos = [];
    }
  } catch (e) {
    photos = [];
  }

  const displayName = user.first_name || user.username || 'Пользователь';
  const displayAge = user.age || 18;
  const displayCity = user.city || 'Не указано';
  const displayBio = user.bio || 'Пользователь пока не добавил описание.';
  const trustScore = user.trust_score || 50;
  const userInitial = (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase();
  const interests = user.interests || [];
  const languages = user.languages || [];
  const isProvider = user.is_service_provider;
  const hasHourlyRate = user.hourly_rate && user.hourly_rate > 0;
  
  // Debug log
  console.log('[ProfileView] User:', user.username, 'isProvider:', isProvider, 'hourlyRate:', user.hourly_rate);

  // Calculate online status
  const getOnlineStatus = () => {
    if (!user.last_active) return { text: 'Был(а) давно', color: 'text-gray-400' };
    const lastActive = new Date(user.last_active);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastActive) / 60000);
    
    if (diffMinutes < 5) return { text: 'Онлайн', color: 'text-green-500' };
    if (diffMinutes < 60) return { text: `${diffMinutes} мин назад`, color: 'text-yellow-500' };
    if (diffMinutes < 1440) return { text: `${Math.floor(diffMinutes / 60)} ч назад`, color: 'text-orange-500' };
    return { text: 'Был(а) давно', color: 'text-gray-400' };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {photos[0] ? (
                  <img src={photos[0]} alt={user.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 text-white font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
              {onlineStatus.text === 'Онлайн' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-bold">{displayName}</h2>
              <div className={`flex items-center text-sm ${onlineStatus.color}`}>
                <Clock className="w-3 h-3 mr-1" />
                <span>{onlineStatus.text}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{trustScore}</span>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <div className="container mx-auto px-4 flex gap-1 min-w-max">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === 'profile' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Профиль
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === 'details' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Анкета
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === 'booking' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Бронирование
            </button>

            {matchId && (
              <>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'chat' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Чат
                </button>

                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'video' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Видео
                </button>

                <button
                  onClick={() => setActiveTab('activities')}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'activities' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  Активности
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            {/* Photo Carousel */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-200">
                {photos.length > 0 ? (
                  <>
                    <img 
                      src={photos[currentPhotoIndex]} 
                      alt={`Photo ${currentPhotoIndex + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          disabled={currentPhotoIndex === 0}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          disabled={currentPhotoIndex === photos.length - 1}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                          {photos.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentPhotoIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200">
                    <span className="text-8xl text-white font-bold">{userInitial}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="bg-white px-3 py-1 rounded-full shadow-lg flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">{trustScore}</span>
                  </div>
                  {user.service_verified && (
                    <div className="bg-green-500 px-3 py-1 rounded-full shadow-lg flex items-center text-white">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">Верифицирован</span>
                    </div>
                  )}
                </div>

                {/* Service Provider Badge */}
                {isProvider && (
                  <div className="absolute bottom-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full shadow-lg text-white">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold">{user.hourly_rate?.toLocaleString()} ₽/час</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold">{displayName}, {displayAge}</h2>
                  {user.zodiac_sign && (
                    <span className="text-2xl" title={translations.zodiac_sign[user.zodiac_sign]}>
                      {translations.zodiac_sign[user.zodiac_sign]?.split(' ')[1] || ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{displayCity}</span>
                </div>

                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.occupation && (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {user.occupation}
                    </div>
                  )}
                  {user.education && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {translations.education[user.education] || user.education}
                    </div>
                  )}
                  {user.height && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                      <Ruler className="w-3 h-3 mr-1" />
                      {user.height} см
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">О себе:</h3>
                  <p className="text-gray-700 leading-relaxed">{displayBio}</p>
                </div>

                {/* Interests */}
                {interests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Интересы:</h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest, idx) => (
                        <span key={idx} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                          {interestIcons[interest] || '🎯'} {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Языки:</h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          🌍 {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {isProvider && (
                    <button
                      onClick={() => setActiveTab('booking')}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Забронировать
                    </button>
                  )}
                  {matchId && (
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="flex-1 bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Написать
                    </button>
                  )}
                </div>

                {/* Screen Sharing - Always visible on Profile tab */}
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-800">Совместный просмотр</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Делитесь экраном с партнёром — смотрите вместе видео или фильмы
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getDisplayMedia({
                          video: true,
                          audio: true
                        });
                        console.log('Screen sharing started:', stream);
                        alert('Шеринг экрана запущен! В полной версии это будет транслироваться партнёру.');
                      } catch (err) {
                        console.error('Screen share error:', err);
                        if (err.name !== 'NotAllowedError') {
                          alert('Не удалось запустить шеринг экрана');
                        }
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Monitor className="w-5 h-5" />
                    Начать шеринг экрана
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS/QUESTIONNAIRE TAB */}
        {activeTab === 'details' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Расширенная анкета
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Physical */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-pink-500" />
                    Внешность
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {user.height && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Рост</p>
                        <p className="font-semibold">{user.height} см</p>
                      </div>
                    )}
                    {user.weight && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Вес</p>
                        <p className="font-semibold">{user.weight} кг</p>
                      </div>
                    )}
                    {user.body_type && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Телосложение</p>
                        <p className="font-semibold">{translations.body_type[user.body_type] || user.body_type}</p>
                      </div>
                    )}
                    {user.hair_color && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Цвет волос</p>
                        <p className="font-semibold">{user.hair_color}</p>
                      </div>
                    )}
                    {user.eye_color && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Цвет глаз</p>
                        <p className="font-semibold">{user.eye_color}</p>
                      </div>
                    )}
                    {user.zodiac_sign && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Знак зодиака</p>
                        <p className="font-semibold">{translations.zodiac_sign[user.zodiac_sign] || user.zodiac_sign}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Career & Education */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    Карьера и образование
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {user.occupation && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Профессия</p>
                        <p className="font-semibold">{user.occupation}</p>
                      </div>
                    )}
                    {user.company && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Компания</p>
                        <p className="font-semibold">{user.company}</p>
                      </div>
                    )}
                    {user.education && (
                      <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                        <p className="text-xs text-gray-500">Образование</p>
                        <p className="font-semibold">{translations.education[user.education] || user.education}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Wine className="w-5 h-5 text-purple-500" />
                    Стиль жизни
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {user.smoking && (
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                        <Cigarette className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Курение</p>
                          <p className="font-semibold">{translations.smoking[user.smoking] || user.smoking}</p>
                        </div>
                      </div>
                    )}
                    {user.drinking && (
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                        <Wine className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Алкоголь</p>
                          <p className="font-semibold">{translations.drinking[user.drinking] || user.drinking}</p>
                        </div>
                      </div>
                    )}
                    {user.children && (
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 col-span-2">
                        <Baby className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Дети</p>
                          <p className="font-semibold">{translations.children[user.children] || user.children}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Looking for */}
                {user.relationship_type && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Ищу
                    </h3>
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <p className="font-semibold text-pink-800">
                        {translations.relationship_type[user.relationship_type] || user.relationship_type}
                      </p>
                    </div>
                  </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-green-500" />
                      Языки
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Интересы
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest, idx) => (
                        <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg font-medium">
                          {interestIcons[interest] || '🎯'} {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* No data message */}
                {!user.height && !user.weight && !user.body_type && !user.occupation && !user.smoking && interests.length === 0 && photos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Пользователь ещё не заполнил расширенную анкету</p>
                  </div>
                )}

                {/* Photos Gallery Section */}
                {photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Image className="w-5 h-5 text-indigo-500" />
                      Фотографии ({photos.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer hover:scale-105 transition border-2 border-transparent hover:border-pink-400"
                          onClick={() => {
                            setCurrentPhotoIndex(idx);
                            setActiveTab('profile');
                          }}
                        >
                          <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screen Sharing Section */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-500" />
                    Совместный просмотр
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm mb-4">
                      Делитесь экраном с партнёром — смотрите вместе видео, фильмы или что угодно в реальном времени
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getDisplayMedia({
                            video: true,
                            audio: true
                          });
                          // Handle screen share stream
                          console.log('Screen sharing started:', stream);
                          alert('Шеринг экрана запущен! В полной версии это будет транслироваться партнёру.');
                        } catch (err) {
                          console.error('Screen share error:', err);
                          if (err.name !== 'NotAllowedError') {
                            alert('Не удалось запустить шеринг экрана');
                          }
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Monitor className="w-5 h-5" />
                      Начать шеринг экрана
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {isProvider && hasHourlyRate && (
                      <button
                        onClick={() => setActiveTab('booking')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-5 h-5" />
                        Забронировать
                      </button>
                    )}
                    {matchId && (
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition font-semibold flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Написать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING TAB */}
        {activeTab === 'booking' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8 text-white text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                  {photos && photos[0] ? (
                    <img src={photos[0]} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold">{userInitial}</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
                {isProvider && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg">Провайдер услуг</span>
                    {user?.service_verified && (
                      <span className="bg-green-400 px-2 py-0.5 rounded-full text-xs font-bold">✓</span>
                    )}
                  </div>
                )}
                {hasHourlyRate && (
                  <div className="text-4xl font-bold">
                    {user?.hourly_rate?.toLocaleString()} ₽<span className="text-lg font-normal">/час</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {!isProvider ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Не является провайдером</h3>
                    <p className="text-gray-600">Этот пользователь не предоставляет услуги.</p>
                  </div>
                ) : !hasHourlyRate ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Бронирование недоступно</h3>
                    <p className="text-gray-600">Провайдер ещё не настроил цены на свои услуги.</p>
                  </div>
                ) : (
                  <>
                    {/* Services offered */}
                    {user?.services_offered && user.services_offered.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Услуги:</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.services_offered.map((service, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trust indicators */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm font-medium">Безопасная оплата</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm font-medium">Рейтинг {trustScore}</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm font-medium">Проверенный</p>
                      </div>
                    </div>

                    {/* Book button */}
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-6 h-6" />
                      Забронировать встречу
                    </button>

                    <p className="text-center text-gray-500 text-sm mt-4">
                      Оплата происходит безопасно через Stripe
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && matchId && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Начните общение!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_id === currentUserId
                            ? 'bg-pink-600 text-white rounded-br-sm'
                            : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-pink-200' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === 'video' && matchId && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gray-900 aspect-video relative">
                {isCallActive ? (
                  <>
                    <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                      <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Video className="w-20 h-20 mb-4 text-gray-500" />
                    <p className="text-xl mb-2">Видеозвонок с {displayName}</p>
                    <p className="text-gray-400">Нажмите "Начать звонок"</p>
                  </div>
                )}
              </div>

              <div className="p-4 flex justify-center gap-4">
                {isCallActive ? (
                  <>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6" />}
                    </button>
                    <button onClick={endVideoCall} className="p-4 rounded-full bg-red-600 text-white">
                      <Phone className="w-6 h-6 rotate-135" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startVideoCall}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition font-semibold flex items-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Начать звонок
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === 'activities' && matchId && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Совместные активности</h2>
              </div>

              <div className="p-6 space-y-4">
                <Link
                  to={`/cinema/${matchId}`}
                  className="block p-4 border-2 border-pink-200 rounded-xl hover:bg-pink-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center">
                      <Film className="w-7 h-7 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Кинотеатр</h3>
                      <p className="text-gray-600 text-sm">Смотрите фильмы вместе онлайн</p>
                    </div>
                  </div>
                </Link>

                <div className="p-4 border-2 border-gray-200 rounded-xl opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                      <UtensilsCrossed className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-400">Бронирование ресторана</h3>
                      <p className="text-gray-400 text-sm">Скоро</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-gray-200 rounded-xl opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Hotel className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-400">Бронирование отеля</h3>
                      <p className="text-gray-400 text-sm">Скоро</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          provider={user}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(booking) => {
            setShowBookingModal(false);
            navigate(`/bookings?new_booking=${booking.id}`);
          }}
        />
      )}

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
