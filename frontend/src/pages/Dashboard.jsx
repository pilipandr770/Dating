import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import axios from 'axios';
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch (error) {
        // If token is invalid, redirect to login
        localStorage.removeItem('access_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchLikesCount = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/match/likes/incoming', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        setLikesCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch likes count:', err);
      }
    };

    const fetchVerificationStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/verification/status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        setVerificationStatus(response.data);
      } catch (err) {
        console.error('Failed to fetch verification status:', err);
      }
    };

    fetchUser();
    fetchLikesCount();
    fetchVerificationStatus();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pink-600">LoveMatch</h1>
          <div className="flex items-center gap-4">
            {user?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                🛡️ Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Willkommen, {user?.username}!</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Ihr Profil</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>E-Mail:</strong> {user?.email}</p>
                <p><strong>Benutzername:</strong> {user?.username}</p>
                <p><strong>Alter:</strong> {user?.age}</p>
                <p><strong>Stadt:</strong> {user?.city}</p>
                <p><strong>Ziel:</strong> {user?.goal}</p>
                <p><strong>Tarif:</strong> {user?.subscription_plan}</p>
                <p><strong>Trust Score:</strong> {user?.trust_score}</p>
                {user?.is_service_provider && (
                  <>
                    <p><strong>Geschäft:</strong> {user?.business_name}</p>
                    <p><strong>Verifizierung:</strong> {user?.service_verified ? 'Ja' : 'Ausstehend'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Schnelle Aktionen</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
                >
                  Profil bearbeiten
                </button>
                <button
                  onClick={() => navigate('/discover/categories')}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Matches finden
                </button>
                <button
                  onClick={() => navigate('/likes')}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition relative"
                >
                  💕 Sie gefallen jemandem
                  {likesCount > 0 && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      {likesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/matches')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Meine Matches
                </button>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
                  Plan upgraden
                </button>

                {user?.is_service_provider && (
                  <>
                    <button
                      onClick={() => navigate('/provider/dashboard')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"
                    >
                      📊 Anbieterstatistik
                    </button>
                    <button
                      onClick={() => navigate('/provider/settings')}
                      className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-lg hover:from-pink-700 hover:to-orange-700 transition font-semibold"
                    >
                      ⚙️ Anbietereinstellungen
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 transition"
                >
                  📅 Meine Buchungen
                </button>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {!user?.email_verified && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800">
                <strong>Achtung:</strong> Bestätigen Sie Ihre E-Mail für Zugang zu allen Funktionen
              </p>
            </div>
          )}

          {/* Identity Verification Banner - Compact version */}
          {verificationStatus && !verificationStatus.can_use_platform && (
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Verifizierung erforderlich</h3>
                  <p className="text-sm text-gray-600">
                    {verificationStatus.identity_verification_status === 'pending' 
                      ? 'Verifizierung läuft...' 
                      : 'Bestätigen Sie Ihr Alter (18+) für Plattformzugang'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/edit-profile')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Starten
              </button>
            </div>
          )}

          {/* Verified Badge */}
          {verificationStatus?.can_use_platform && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 text-sm">
                <strong>Verifizierung abgeschlossen</strong> — Ihre Identität ist bestätigt
              </span>
            </div>
          )}

          {user?.is_service_provider && !user?.service_verified && (
            <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800">
                <strong>Verifizierung:</strong> Ihr Anbieterkonto wird überprüft
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
