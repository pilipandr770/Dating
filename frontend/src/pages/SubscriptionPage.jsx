import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '9.99',
      period: 'Monat',
      color: 'from-gray-500 to-gray-600',
      features: [
        'Unbegrenzte Matches',
        'Standard-Chat',
        'Profilansicht',
        '10 Likes pro Tag',
      ],
      notIncluded: [
        'AI Chat-Assistent',
        'Prioritäts-Support',
        'Anonymes Profil',
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '19.99',
      period: 'Monat',
      color: 'from-pink-500 to-rose-600',
      popular: true,
      features: [
        'Unbegrenzte Matches',
        'Premium-Chat',
        'Profilansicht',
        'Unbegrenzte Likes',
        '🤖 AI Chat-Assistent',
        'Gesprächsanalyse',
        'Antwortvorschläge',
        'Betrugs-Erkennung',
      ],
      notIncluded: [
        'Anonymes Profil',
      ]
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '29.99',
      period: 'Monat',
      color: 'from-yellow-500 to-amber-600',
      features: [
        'Alles aus Premium',
        '👑 VIP-Badge',
        'Anonymes Profil',
        'Prioritäts-Support',
        'Profil-Boost',
        'Wer hat mich besucht',
        'Super-Likes',
        'Rückgängig machen',
      ],
      notIncluded: []
    }
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlan(planId);
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`${API}/payment/create-subscription`, {
        plan: planId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: res.data.sessionId
        });
        
        if (error) {
          console.error('Stripe error:', error);
          alert('Fehler beim Weiterleiten zur Zahlung');
        }
      } else if (res.data.success) {
        // Already subscribed or upgraded
        alert('Abonnement erfolgreich!');
        fetchUser();
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      alert(err.response?.data?.error || 'Fehler beim Abonnieren');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Möchten Sie Ihr Abonnement wirklich kündigen?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/payment/cancel-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Abonnement gekündigt');
      fetchUser();
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Fehler beim Kündigen');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const currentPlan = user?.subscription_plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 text-white/70 hover:text-white"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Wähle deinen Plan
          </h1>
          <p className="text-gray-300 text-lg">
            Upgrade für mehr Funktionen und bessere Chancen
          </p>
          
          {currentPlan !== 'free' && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full">
              <span className="text-lg">✓</span>
              Aktueller Plan: <span className="font-bold capitalize">{currentPlan}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isDowngrade = 
              (currentPlan === 'vip' && (plan.id === 'premium' || plan.id === 'basic')) ||
              (currentPlan === 'premium' && plan.id === 'basic');
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden ${
                  plan.popular ? 'ring-2 ring-pink-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-center py-1 text-sm font-medium">
                    ⭐ Beliebteste Wahl
                  </div>
                )}
                
                <div className={`bg-gray-800/80 backdrop-blur-sm p-8 h-full flex flex-col ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Plan Header */}
                  <div className={`text-center mb-6`}>
                    <h2 className={`text-2xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.name}
                    </h2>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}€</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-1">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-300">
                          <span className="text-green-400">✓</span>
                          {feature}
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-500">
                          <span className="text-gray-600">✗</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => !isCurrentPlan && !isDowngrade && handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isDowngrade || processingPlan === plan.id}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      isCurrentPlan
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : isDowngrade
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:scale-105`
                    } ${processingPlan === plan.id ? 'opacity-50' : ''}`}
                  >
                    {processingPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Wird verarbeitet...
                      </span>
                    ) : isCurrentPlan ? (
                      '✓ Aktueller Plan'
                    ) : isDowngrade ? (
                      'Downgrade nicht möglich'
                    ) : (
                      `${plan.name} wählen`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel Subscription */}
        {currentPlan !== 'free' && (
          <div className="mt-12 text-center">
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-red-400 underline transition-colors"
            >
              Abonnement kündigen
            </button>
          </div>
        )}

        {/* Features Comparison */}
        <div className="mt-16 bg-gray-800/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🤖 AI Chat-Assistent (Premium & VIP)
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">💬</div>
              <h4 className="font-medium text-white mb-2">Antwortvorschläge</h4>
              <p className="text-gray-400 text-sm">
                KI analysiert das Gespräch und schlägt passende Antworten vor
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">🛡️</div>
              <h4 className="font-medium text-white mb-2">Betrugs-Erkennung</h4>
              <p className="text-gray-400 text-sm">
                Warnt vor verdächtigen Nachrichten und möglichem Betrug
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="font-medium text-white mb-2">Gesprächsanalyse</h4>
              <p className="text-gray-400 text-sm">
                Bewertet den Verlauf und gibt Tipps für bessere Kommunikation
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Fragen? Schreib uns an support@loveconnect.de</p>
          <p className="mt-2">Alle Preise inkl. MwSt. Jederzeit kündbar.</p>
        </div>
      </div>
    </div>
  );
}
