import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Film, Calendar, Sparkles, Video,
  User, MessageCircle, Star, Clock
} from 'lucide-react';
import axios from 'axios';
import MovieTheater from '../components/MovieTheater';

export default function ChatRoom() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // chat, movie, date

  useEffect(() => {
    fetchRoomData();
    fetchMessages();

    // Auto-refresh messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Get current user
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentUserId(userResponse.data.user.id);

      // Get room info
      const roomResponse = await axios.get(`http://localhost:5000/api/chat/${matchId}/room`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRoomInfo(roomResponse.data);
    } catch (err) {
      console.error('Failed to load room data:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/${matchId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMessages(response.data.messages);
      setOtherUser(response.data.other_user);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await axios.post(
        `http://localhost:5000/api/chat/${matchId}/messages`,
        { message: newMessage },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setNewMessage('');
      fetchMessages(); // Refresh messages
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/matches" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </Link>

          {otherUser && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {otherUser.photos && JSON.parse(otherUser.photos)[0] ? (
                  <img src={JSON.parse(otherUser.photos)[0]} alt={otherUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 text-white font-bold">
                    {otherUser.first_name?.[0] || otherUser.username[0]}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold">{otherUser.first_name || otherUser.username}</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                  <span>Trust: {otherUser.trust_score}</span>
                </div>
              </div>
            </div>
          )}

          <div className="w-20"></div>
        </div>

        {/* Feature Tabs */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-4 flex gap-1">
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

            {roomInfo?.features.movie_theater && (
              <button
                onClick={() => setActiveTab('movie')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === 'movie'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Film className="w-4 h-4" />
                Кинотеатр
              </button>
            )}

            <button
              onClick={() => setActiveTab('date')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'date'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Планирование
            </button>

            {roomInfo?.features.ai_assistant && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === 'ai'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Помощник
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {activeTab === 'chat' && (
          <>
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
                            isOwn
                              ? 'bg-pink-600 text-white'
                              : 'bg-gray-200 text-gray-900'
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
          </>
        )}

        {activeTab === 'movie' && (
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <MovieTheater matchId={matchId} currentUserId={currentUserId} otherUser={otherUser} />
          </div>
        )}

        {activeTab === 'date' && (
          <div className="flex-1 bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Планирование Встречи</h2>
              <p className="text-gray-600 mb-6">
                Спланируйте и забронируйте вашу встречу!
              </p>
              <div className="bg-pink-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-700">
                  Функция в разработке. Скоро вы сможете:
                </p>
                <ul className="mt-3 text-left text-sm text-gray-600 space-y-2">
                  <li>• Предложить время и место встречи</li>
                  <li>• Забронировать столик в ресторане</li>
                  <li>• Купить билеты в кино/театр</li>
                  <li>• Напоминания о встрече</li>
                  <li>• Безопасная проверка местоположения</li>
                </ul>
              </div>
              <button className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition">
                Запланировать встречу (скоро)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex-1 bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">AI Ассистент</h2>
              <p className="text-gray-600 mb-6">
                Умный помощник для вашего общения
              </p>
              <div className="bg-pink-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-700">
                  Функция в разработке. AI поможет вам:
                </p>
                <ul className="mt-3 text-left text-sm text-gray-600 space-y-2">
                  <li>• Предложения тем для разговора</li>
                  <li>• Анализ сообщений на признаки мошенничества</li>
                  <li>• Советы по общению</li>
                  <li>• Перевод сообщений</li>
                  <li>• Идеи для встреч</li>
                </ul>
              </div>
              <button className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition">
                Получить совет AI (скоро)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
