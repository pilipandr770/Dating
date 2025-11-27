import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Film, Calendar, Sparkles, Video,
  User, MessageCircle, Star, Clock, Shield, AlertTriangle,
  Lightbulb, Bot, X, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import MovieTheater from '../components/MovieTheater';

export default function ChatRoom() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const aiChatEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  // AI Assistant State
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [analyzingChat, setAnalyzingChat] = useState(false);

  useEffect(() => {
    fetchRoomData();
    fetchMessages();
    fetchAiStatus();

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages]);

  const fetchAiStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:5000/api/chat/ai/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAiEnabled(response.data.ai_enabled);
      setAiAvailable(response.data.ai_available);
      setCanUseAi(response.data.can_use_ai);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentUserId(userResponse.data.user.id);
      setCurrentUser(userResponse.data.user);

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
      fetchMessages();
      
      // Refresh AI suggestions after sending
      if (aiEnabled && showAiPanel) {
        setTimeout(() => fetchAiSuggestions(), 1000);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleAiAssistant = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/api/chat/ai/toggle',
        { enabled: !aiEnabled },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAiEnabled(response.data.ai_enabled);
      if (response.data.ai_enabled) {
        setShowAiPanel(true);
        fetchAiAnalysis();
        fetchAiSuggestions();
      }
    } catch (err) {
      console.error('Failed to toggle AI:', err);
      alert(err.response?.data?.error || 'Fehler beim Aktivieren des AI-Assistenten');
    }
  };

  const fetchAiAnalysis = async () => {
    if (!aiEnabled) return;
    
    setAnalyzingChat(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:5000/api/chat/${matchId}/ai/analyze`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAiAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Failed to get AI analysis:', err);
    } finally {
      setAnalyzingChat(false);
    }
  };

  const fetchAiSuggestions = async () => {
    if (!aiEnabled) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://localhost:5000/api/chat/${matchId}/ai/suggestions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAiSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to get AI suggestions:', err);
    }
  };

  const sendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiChatInput.trim() || aiLoading) return;

    const userMessage = aiChatInput;
    setAiChatInput('');
    setAiChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:5000/api/chat/${matchId}/ai/chat`,
        { message: userMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      console.error('Failed to chat with AI:', err);
      setAiChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: err.response?.data?.error || 'Fehler bei der AI-Anfrage' 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setNewMessage(suggestion);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getSafetyColor = (level) => {
    switch (level) {
      case 'safe': return 'text-green-600 bg-green-100';
      case 'caution': return 'text-yellow-600 bg-yellow-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSafetyIcon = (level) => {
    switch (level) {
      case 'safe': return <Shield className="w-5 h-5" />;
      case 'caution': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'danger': return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
  }

  // Check if this is a dating chat (not service provider)
  const isDatingChat = !otherUser?.is_service_provider && currentUser?.goal !== 'intimate_services';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/matches" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
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

          {/* AI Toggle Button - only for dating chats */}
          {isDatingChat && canUseAi && (
            <button
              onClick={() => {
                if (!aiEnabled) {
                  toggleAiAssistant();
                } else {
                  setShowAiPanel(!showAiPanel);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                aiEnabled 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI {aiEnabled ? 'An' : 'Aus'}
            </button>
          )}

          {!isDatingChat && <div className="w-20"></div>}
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
              Chat
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
                Kino
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
              Planung
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex gap-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showAiPanel && aiEnabled ? 'w-1/2' : 'w-full'}`}>
          {activeTab === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 bg-white rounded-lg shadow-lg p-4 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p>Schreiben Sie die erste Nachricht!</p>
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

              {/* AI Suggestions Bar */}
              {aiEnabled && aiSuggestions.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 mb-2 flex items-center gap-2 overflow-x-auto">
                  <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  {aiSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => useSuggestion(suggestion)}
                      className="bg-white px-3 py-1 rounded-full text-sm text-purple-700 hover:bg-purple-100 transition whitespace-nowrap border border-purple-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={sendMessage} className="bg-white rounded-lg shadow-lg p-4 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Senden
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
                <h2 className="text-2xl font-bold mb-4">Terminplanung</h2>
                <p className="text-gray-600 mb-6">
                  Planen und buchen Sie Ihr Treffen!
                </p>
                <div className="bg-pink-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-700">
                    Funktion in Entwicklung. Bald können Sie:
                  </p>
                  <ul className="mt-3 text-left text-sm text-gray-600 space-y-2">
                    <li>• Zeit und Ort für das Treffen vorschlagen</li>
                    <li>• Einen Tisch im Restaurant reservieren</li>
                    <li>• Tickets für Kino/Theater kaufen</li>
                    <li>• Erinnerungen an das Treffen</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        {showAiPanel && aiEnabled && isDatingChat && (
          <div className="w-96 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
            {/* AI Panel Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold">AI-Assistent</span>
              </div>
              <button 
                onClick={() => setShowAiPanel(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safety Analysis */}
            {aiAnalysis && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Sicherheitsanalyse</h3>
                  <button 
                    onClick={fetchAiAnalysis}
                    className="text-purple-600 hover:text-purple-800"
                    disabled={analyzingChat}
                  >
                    <RefreshCw className={`w-4 h-4 ${analyzingChat ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getSafetyColor(aiAnalysis.safety_level)}`}>
                  {getSafetyIcon(aiAnalysis.safety_level)}
                  <span className="font-medium capitalize">
                    {aiAnalysis.safety_level === 'safe' && 'Sicher'}
                    {aiAnalysis.safety_level === 'caution' && 'Vorsicht'}
                    {aiAnalysis.safety_level === 'warning' && 'Warnung'}
                    {aiAnalysis.safety_level === 'danger' && 'Gefahr'}
                  </span>
                </div>

                {aiAnalysis.warnings && aiAnalysis.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800 font-medium">⚠️ Warnungen:</p>
                    <ul className="text-sm text-orange-700 mt-1">
                      {aiAnalysis.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.mood_analysis && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Stimmung:</strong> {aiAnalysis.mood_analysis}
                  </p>
                )}

                {aiAnalysis.tips && aiAnalysis.tips.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 font-medium">💡 Tipps:</p>
                    <ul className="text-sm text-gray-600">
                      {aiAnalysis.tips.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">
                  Frag mich um Rat zur Konversation!
                </p>
              </div>

              {/* AI Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiChatMessages.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Stell mir eine Frage!</p>
                    <div className="mt-4 space-y-2">
                      <button 
                        onClick={() => setAiChatInput('Was soll ich antworten?')}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                      >
                        Was soll ich antworten?
                      </button>
                      <button 
                        onClick={() => setAiChatInput('Analysiere das Gespräch')}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 ml-2"
                      >
                        Analysiere das Gespräch
                      </button>
                    </div>
                  </div>
                )}

                {aiChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={aiChatEndRef} />
              </div>

              {/* AI Chat Input */}
              <form onSubmit={sendAiMessage} className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Frag den AI-Assistenten..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiChatInput.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Premium Upsell for non-premium users */}
      {isDatingChat && !canUseAi && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-xl max-w-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">AI-Assistent</h3>
              <p className="text-sm text-white/90 mt-1">
                Upgrade auf Premium für AI-gestützte Gesprächsanalyse und Vorschläge!
              </p>
              <button 
                onClick={() => navigate('/subscription')}
                className="mt-2 bg-white text-purple-600 px-4 py-1 rounded-full text-sm font-semibold hover:bg-purple-50 transition"
              >
                Premium holen
              </button>
            </div>
            <button 
              onClick={(e) => e.target.closest('.fixed').style.display = 'none'}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
