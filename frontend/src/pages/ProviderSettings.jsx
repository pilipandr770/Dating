import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import axios from 'axios';

export default function ProviderSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    tax_id: '',
    hourly_rate: '',
    services_offered: []
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const userData = response.data.user;
      setUser(userData);

      // Pre-fill form with existing data
      setFormData({
        tax_id: userData.tax_id || '',
        hourly_rate: userData.hourly_rate || '',
        services_offered: userData.services_offered || []
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setLoading(false);
    }
  };

  const handleSetupStripe = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/api/payment/provider/setup',
        { tax_id: formData.tax_id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: response.data.message });
      fetchUserData(); // Refresh user data
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Fehler bei der Kontoeinrichtung' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRate = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:5000/api/auth/update-profile',
        { hourly_rate: parseFloat(formData.hourly_rate) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Stundensatz erfolgreich aktualisiert' });
      fetchUserData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Aktualisieren des Stundensatzes' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!user?.is_service_provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Zugriff verweigert</h2>
          <p className="text-gray-600 text-center mb-6">
            Diese Seite ist nur für Dienstleister verfügbar
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <h1 className="text-xl font-bold">Dienstleister-Einstellungen</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* Stripe Connection Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-pink-600" />
              Status des Zahlungskontos
            </h2>
            {user.stripe_account_id ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Verbunden</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Nicht verbunden</span>
              </div>
            )}
          </div>

          {user.stripe_account_id ? (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                ✓ Ihr Stripe-Konto ist verbunden und bereit für Zahlungen
              </p>
              <p className="text-xs text-green-600">
                Account ID: {user.stripe_account_id}
              </p>
              {user.service_verified && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Verifizierung bei Stripe erfolgreich
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-5 mb-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                      Wie man Zahlungen über Stripe akzeptiert
                    </p>
                    <ol className="text-xs text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">1.</span>
                        <div>
                          <strong>Registrieren Sie Ihr Unternehmen bei Stripe:</strong>
                          <br />
                          Gehen Sie zu{' '}
                          <a
                            href="https://dashboard.stripe.com/register"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            dashboard.stripe.com/register
                          </a>
                          <br />
                          Stripe führt eine vollständige Verifizierung Ihres Unternehmens durch
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">2.</span>
                        <div>
                          <strong>API-Schlüssel erhalten:</strong>
                          <br />
                          Nach der Registrierung bei{' '}
                          <a
                            href="https://dashboard.stripe.com/apikeys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            Bereich API Keys
                          </a>
                          {' '}holen Sie sich den Secret Key
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">3.</span>
                        <div>
                          <strong>Geben Sie den Schlüssel unten ein:</strong>
                          <br />
                          Wir verbinden Ihr Stripe-Konto mit der Plattform
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-800">
                      <strong>Wichtig:</strong> Stripe prüft die Legalität des Geschäfts, Steuerdokumente
                      und die Identität des Eigentümers. Alle Daten werden bei Stripe gespeichert, wir speichern nicht
                      Ihre Steuerdaten.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="sk_live_... oder sk_test_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ihr Secret Key wird sicher gespeichert und nur für die Zahlungsabwicklung verwendet
                </p>
              </div>

              <button
                onClick={handleSetupStripe}
                disabled={saving || !formData.tax_id}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition disabled:opacity-50 font-semibold"
              >
                {saving ? 'Verbinden...' : 'Stripe-Konto verbinden'}
              </button>

              <div className="text-center">
                <a
                  href="https://stripe.com/docs/connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Mehr über Stripe Connect →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Hourly Rate */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-pink-600" />
            Stundensatz
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stundensatz (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  placeholder="5000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  €/Std
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dieser Stundensatz wird Kunden bei der Buchung angezeigt
              </p>
            </div>

            {user.hourly_rate && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Aktueller Stundensatz: <span className="font-bold">{user.hourly_rate} €/Std</span>
                </p>
              </div>
            )}

            <button
              onClick={handleUpdateRate}
              disabled={saving || !formData.hourly_rate}
              className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Speichern...' : 'Stundensatz aktualisieren'}
            </button>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Briefcase className="w-6 h-6 text-pink-600" />
            Angebotene Dienstleistungen
          </h2>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Funktion in Entwicklung. Bald können Sie eine Liste der Dienstleistungen angeben, die Sie Ihren Kunden anbieten.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg"
          >
            📊 Statistiken und Einnahmen
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-semibold shadow-lg"
          >
            📅 Meine Buchungen
          </button>
        </div>
      </main>
    </div>
  );
}
