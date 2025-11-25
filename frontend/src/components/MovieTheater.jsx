import { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorOff, Send, MessageCircle, Video, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function MovieTheater({ matchId, currentUserId, otherUser }) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const videoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Загрузка сообщений
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
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
    if (!newMessage.trim() || sending) return;

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

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      screenStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsScreenSharing(true);

      // Автоматическая остановка при закрытии демонстрации
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Failed to start screen share:', err);
      if (err.name === 'NotAllowedError') {
        alert('Вы отклонили запрос на демонстрацию экрана');
      } else if (err.name === 'NotFoundError') {
        alert('Не удалось найти экран для демонстрации');
      } else {
        alert('Не удалось начать демонстрацию экрана');
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScreenSharing(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Screen Share Area */}
      <div className="flex-1 bg-black relative overflow-hidden">
        {!isScreenSharing ? (
          // Placeholder when not sharing
          <div className="h-full flex flex-col items-center justify-center text-white p-8">
            <div className="text-center max-w-lg">
              <Video className="w-24 h-24 mx-auto mb-6 text-pink-500" />
              <h2 className="text-3xl font-bold mb-4">Совместный просмотр</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Поделитесь своим экраном, чтобы смотреть фильмы, видео или любой контент вместе!
              </p>

              <button
                onClick={startScreenShare}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Monitor className="w-6 h-6" />
                Начать демонстрацию экрана
              </button>

              <div className="mt-8 p-4 bg-gray-900 rounded-lg text-left">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 font-semibold mb-1">Важно:</p>
                    <p className="text-xs text-gray-400">
                      Вы несёте ответственность за контент, который демонстрируете.
                      Убедитесь, что у вас есть права на показ материалов.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-pink-400 font-bold mb-2">✓ Можно</div>
                  <ul className="text-gray-400 text-xs space-y-1 text-left">
                    <li>• Ваши видео и фото</li>
                    <li>• Легальный стриминг-сервис</li>
                    <li>• Презентации и документы</li>
                    <li>• Видеоигры</li>
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-red-400 font-bold mb-2">✗ Нельзя</div>
                  <ul className="text-gray-400 text-xs space-y-1 text-left">
                    <li>• Пиратский контент</li>
                    <li>• Материалы 18+</li>
                    <li>• Личные данные других</li>
                    <li>• Незаконный контент</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Video display when sharing
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />

            {/* Stop button */}
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white font-bold text-sm">Демонстрация активна</span>
              </div>
              <button
                onClick={stopScreenShare}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-lg"
                title="Остановить демонстрацию"
              >
                <MonitorOff className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Chat Section */}
      <div className="bg-white border-t border-gray-200" style={{ height: '300px' }}>
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold text-gray-900">Чат во время просмотра</h3>
            {otherUser && (
              <span className="ml-auto text-sm text-gray-600">
                с {otherUser.first_name || otherUser.username}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p className="text-sm">Обсудите, что смотрите!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-pink-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1 text-gray-600">
                            {msg.sender_name}
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-pink-200' : 'text-gray-400'}`}>
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
          <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
