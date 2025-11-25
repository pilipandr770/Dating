import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Video, Image, User, MessageCircle,
  Star, MapPin, Calendar, Sparkles, Heart, X, Monitor,
  Mic, MicOff, VideoOff, Phone
} from 'lucide-react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import RealStripePaymentModal from '../components/RealStripePayment';

export default function ProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // profile, photos, chat, video
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

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
      console.log('[PROFILE VIEW] Fetching user profile:', userId);
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:5000/api/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('[PROFILE VIEW] Response received:', response.data);
      console.log('[PROFILE VIEW] User data:', response.data.user);
      console.log('[PROFILE VIEW] User photos:', response.data.user?.photos);

      setUser(response.data.user);

      // Check if there's a match/chat room with this user
      if (response.data.match_id) {
        setMatchId(response.data.match_id);
      }

      setLoading(false);
      console.log('[PROFILE VIEW] Profile loaded successfully');
    } catch (err) {
      console.error('[PROFILE VIEW] Failed to fetch user profile:', err);
      console.error('[PROFILE VIEW] Error details:', err.response);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/${matchId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !matchId) return;

    setSending(true);
    try {
      await axios.post(
        `http://localhost:5000/api/chat/${matchId}/messages`,
        { message: newMessage },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Video call functions
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCallActive(true);
      // TODO: WebRTC signaling implementation
    } catch (err) {
      console.error('Failed to start video call:', err);
      alert('Не удалось получить доступ к камере/микрофону');
    }
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setLocalStream(null);
    setScreenStream(null);
    setIsCallActive(false);
    setIsScreenSharing(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      setScreenStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);

      // Stop screen sharing when user stops from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Failed to start screen sharing:', err);
      alert('Не удалось начать демонстрацию экрана');
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    setIsScreenSharing(false);
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
          <button
            onClick={() => navigate(-1)}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  console.log('[PROFILE VIEW] Rendering with user:', user);

  // Safe parsing of photos
  let photos = [];
  try {
    if (user.photos) {
      photos = typeof user.photos === 'string' ? JSON.parse(user.photos) : user.photos;
      if (!Array.isArray(photos)) photos = [];
    }
  } catch (e) {
    console.error('[PROFILE VIEW] Error parsing photos:', e);
    photos = [];
  }

  const displayName = user.first_name || user.username || 'Пользователь';
  const displayAge = user.age || 18;
  const displayCity = user.city || 'Не указано';
  const displayBio = user.bio || 'Пользователь пока не добавил описание профиля.';
  const trustScore = user.trust_score || 50;
  const userInitial = (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase();

  console.log('[PROFILE VIEW] Photos count:', photos.length);
  console.log('[PROFILE VIEW] Display name:', displayName);
  console.log('[PROFILE VIEW] User initial:', userInitial);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              {photos[0] ? (
                <img src={photos[0]} alt={user.username || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 text-white font-bold">
                  {userInitial}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold">{displayName}</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span>Trust: {trustScore}</span>
              </div>
            </div>
          </div>

          <div className="w-20"></div>
        </div>

        {/* Feature Tabs */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-4 flex gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Профиль
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'photos'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="w-4 h-4" />
              Фото ({photos.length})
            </button>

            {matchId && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === 'chat'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Чат
              </button>
            )}

            {matchId && (
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === 'video'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Video className="w-4 h-4" />
                Видеозвонок
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            {/* Main Photo */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-200">
                {photos[0] ? (
                  <img src={photos[0]} alt={user.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200">
                    <span className="text-6xl text-white font-bold">
                      {userInitial}
                    </span>
                  </div>
                )}

                {/* Trust Score Badge */}
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="font-semibold">{trustScore}</span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-3xl font-bold mb-2">
                  {displayName}, {displayAge}
                </h2>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{displayCity}</span>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">О себе:</h3>
                  <p className="text-gray-700">{displayBio}</p>
                </div>

                {/* Service Provider Badge */}
                {user.is_service_provider && (
                  <div className="mb-4">
                    <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Провайдер услуг
                      {user.service_verified && ' • Верифицирован'}
                      {user.hourly_rate && ` • ${user.hourly_rate.toLocaleString()} ₽/час`}
                    </div>
                  </div>
                )}

                {/* Debug info - remove in production */}
                {console.log('[ProfileView] User data:', { 
                  username: user.username,
                  is_service_provider: user.is_service_provider, 
                  hourly_rate: user.hourly_rate,
                  showButton: user.is_service_provider && user.hourly_rate
                })}

                {/* Booking Button */}
                {user.is_service_provider && user.hourly_rate && (
                  <button
                    onClick={() => {
                      console.log('[ProfileView] 🔘 Booking button clicked!');
                      setShowBookingModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg flex items-center justify-center gap-2 mb-4"
                  >
                    <Calendar className="w-5 h-5" />
                    Забронировать встречу • {user.hourly_rate.toLocaleString()} ₽/ч
                  </button>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {matchId && (
                    <>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Написать
                      </button>
                      <button
                        onClick={() => setActiveTab('video')}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Видеозвонок
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="max-w-4xl mx-auto">
            {photos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Нет фотографий</p>
              </div>
            ) : (
              <>
                {/* Main Photo Display */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                  <div className="relative h-96 bg-gray-200">
                    <img
                      src={photos[currentPhotoIndex]}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Navigation Arrows */}
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-3 rounded-full shadow-lg hover:bg-opacity-100 transition"
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                    )}

                    {currentPhotoIndex < photos.length - 1 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-3 rounded-full shadow-lg hover:bg-opacity-100 transition"
                      >
                        <ArrowLeft className="w-6 h-6 transform rotate-180" />
                      </button>
                    )}

                    {/* Photo Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden ${
                        currentPhotoIndex === index
                          ? 'ring-4 ring-pink-600'
                          : 'ring-2 ring-gray-200 hover:ring-gray-300'
                      } transition`}
                    >
                      <img src={photo} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'chat' && matchId && (
          <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
            {/* Messages */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-4 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-4" />
                  <p>Напишите первое сообщение!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                          )}
                          <p>{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-pink-200' : 'text-gray-500'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="bg-white rounded-lg shadow-lg p-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Отправить
              </button>
            </form>
          </div>
        )}

        {activeTab === 'video' && matchId && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {!isCallActive ? (
                <div className="p-12 text-center">
                  <Video className="w-20 h-20 text-pink-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Видеозвонок</h2>
                  <p className="text-gray-600 mb-6">
                    Начните видеозвонок с {user.first_name || user.username}
                  </p>
                  <button
                    onClick={startVideoCall}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition font-semibold text-lg flex items-center gap-3 mx-auto"
                  >
                    <Video className="w-6 h-6" />
                    Начать видеозвонок
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Video Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900" style={{ height: '600px' }}>
                    {/* Remote Video */}
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                        {user.first_name || user.username}
                      </div>
                    </div>

                    {/* Local Video */}
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                        Вы {isScreenSharing && '(Демонстрация экрана)'}
                      </div>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full ${
                        isMuted ? 'bg-red-600' : 'bg-gray-700'
                      } text-white hover:bg-opacity-80 transition`}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={toggleVideo}
                      className={`p-4 rounded-full ${
                        isVideoOff ? 'bg-red-600' : 'bg-gray-700'
                      } text-white hover:bg-opacity-80 transition`}
                    >
                      {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      className={`p-4 rounded-full ${
                        isScreenSharing ? 'bg-pink-600' : 'bg-gray-700'
                      } text-white hover:bg-opacity-80 transition`}
                    >
                      <Monitor className="w-6 h-6" />
                    </button>

                    <button
                      onClick={endVideoCall}
                      className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      <Phone className="w-6 h-6 transform rotate-135" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          provider={user}
          onClose={() => {
            console.log('[PROFILE VIEW] 🚪 Closing booking modal');
            setShowBookingModal(false);
          }}
          onSuccess={(booking) => {
            console.log('='.repeat(60));
            console.log('[PROFILE VIEW] 🎉 Booking SUCCESS callback called!');
            console.log('[PROFILE VIEW] Booking data:', booking);
            console.log('[PROFILE VIEW] Booking ID:', booking?.id);
            console.log('[PROFILE VIEW] Closing modal and navigating to /bookings...');
            setShowBookingModal(false);
            const targetUrl = `/bookings?new_booking=${booking.id}`;
            console.log('[PROFILE VIEW] 🚀 Navigating to:', targetUrl);
            navigate(targetUrl);
            console.log('[PROFILE VIEW] ✅ Navigate called!');
            console.log('='.repeat(60));
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
