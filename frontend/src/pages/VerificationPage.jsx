import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard,
  FileText,
  Lock,
  User,
  Camera,
  ArrowRight,
  RefreshCw,
  XCircle,
  Info
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // Check for session_id in URL (return from Stripe)
  const returnSessionId = searchParams.get('session_id');

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  useEffect(() => {
    // If returning from Stripe verification
    if (returnSessionId) {
      checkVerificationSession(returnSessionId);
    }
  }, [returnSessionId]);

  const getAuthHeaders = () => ({
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/verification/status`, getAuthHeaders());
      setVerificationStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationSession = async (sessionId) => {
    setProcessing(true);
    try {
      const response = await axios.get(
        `${API_URL}/verification/check-session/${sessionId}`, 
        getAuthHeaders()
      );
      setVerificationStatus(response.data);
      
      if (response.data.identity_verified && response.data.identity_age_verified) {
        // Verification successful - redirect after delay
        setTimeout(() => {
          navigate('/discover');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check verification status');
    } finally {
      setProcessing(false);
    }
  };

  const startVerification = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/verification/create-session`,
        {},
        getAuthHeaders()
      );
      
      setSessionData(response.data);
      
      // Redirect to Stripe Identity verification
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start verification');
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    if (!verificationStatus) return <Shield className="w-16 h-16 text-gray-400" />;
    
    switch (verificationStatus.identity_verification_status) {
      case 'verified':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Shield className="w-16 h-16 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    if (!verificationStatus) return 'Laden...';
    
    switch (verificationStatus.identity_verification_status) {
      case 'verified':
        return verificationStatus.identity_age_verified 
          ? 'Verifizierung erfolgreich! ✓' 
          : 'Dokument geprüft, aber Alter nicht bestätigt';
      case 'pending':
        return 'Verifizierung läuft...';
      case 'processing':
        return 'Dokumente werden geprüft...';
      case 'failed':
        return 'Verifizierung fehlgeschlagen';
      case 'cancelled':
        return 'Verifizierung abgebrochen';
      case 'requires_input':
        return 'Zusätzliche Informationen erforderlich';
      default:
        return 'Verifizierung fehlgeschlagen';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Already verified
  if (verificationStatus?.identity_verified && verificationStatus?.identity_age_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Verifizierung erfolgreich! ✓
          </h1>
          <p className="text-gray-600 mb-6">
            Ihre Identität wurde bestätigt. Sie können alle Funktionen der Plattform nutzen.
          </p>
          
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Verifiziert</span>
            </div>
            {verificationStatus.identity_verified_at && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Datum:</span>
                <span className="text-gray-800">
                  {new Date(verificationStatus.identity_verified_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}
            {verificationStatus.identity_document_type && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Dokument:</span>
                <span className="text-gray-800 capitalize">
                  {verificationStatus.identity_document_type.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigate('/discover')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            Zu den Bekanntschaften gehen
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            {getStatusIcon()}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Identitätsverifizierung
          </h1>
          <p className="text-gray-600">
            Bestätigen Sie Ihr Alter (18+) für die sichere Nutzung der Plattform
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Verifizierungsstatus</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              verificationStatus?.identity_verified 
                ? 'bg-green-100 text-green-700'
                : verificationStatus?.identity_verification_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {getStatusMessage()}
            </span>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Fehler</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Verification Steps */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">1. Dokument hochladen</h3>
                <p className="text-sm text-gray-600">
                  Pass, Personalausweis oder Führerschein
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">2. Selfie machen</h3>
                <p className="text-sm text-gray-600">
                  Für den Vergleich mit dem Foto im Dokument
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">3. Automatische Überprüfung</h3>
                <p className="text-sm text-gray-600">
                  Stripe prüft die Dokumente in wenigen Minuten
                </p>
              </div>
            </div>
          </div>

          {/* Start Verification Button */}
          {(!verificationStatus?.identity_verified || !verificationStatus?.identity_age_verified) && (
            <button
              onClick={startVerification}
              disabled={processing}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Vorbereitung...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Verifizierung starten — €1.99
                </>
              )}
            </button>
          )}

          {verificationStatus?.verification_attempts > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Verifizierungsversuche: {verificationStatus.verification_attempts}/5
            </p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold text-gray-800">GDPR Compliant</h3>
            </div>
            <p className="text-sm text-gray-600">
              Ihre Daten werden bei Stripe gespeichert, nicht auf unserer Plattform. 
              Vollständige Einhaltung der europäischen Datenschutzstandards.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Bot-Schutz</h3>
            </div>
            <p className="text-sm text-gray-600">
              Die Verifizierung stellt sicher, dass nur echte Personen über 18 Jahren auf der Plattform sind.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Sicherheit</h3>
            </div>
            <p className="text-sm text-gray-600">
              Verifizierte Benutzer schaffen einen sicheren Raum für alle Teilnehmer.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-6 h-6 text-pink-500" />
              <h3 className="font-semibold text-gray-800">Einmalzahlung</h3>
            </div>
            <p className="text-sm text-gray-600">
              Die Verifizierung wird einmal bezahlt und gilt für die gesamte Nutzungszeit der Plattform.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Häufig gestellte Fragen
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800">Warum ist eine Verifizierung erforderlich?</h4>
              <p className="text-sm text-gray-600">
                Zum Schutz der Benutzer vor Betrügern und Bots sowie zur Bestätigung des Alters 18+.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">Welche Dokumente werden akzeptiert?</h4>
              <p className="text-sm text-gray-600">
                Pass, Personalausweis (ID-Karte) oder Führerschein.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">Wo werden meine Daten gespeichert?</h4>
              <p className="text-sm text-gray-600">
                Alle Dokumente werden von Stripe verarbeitet und gespeichert — wir haben keinen Zugriff auf Ihre Dokumente.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">Warum ist die Verifizierung kostenpflichtig?</h4>
              <p className="text-sm text-gray-600">
                Stripe erhebt eine Gebühr für die Dokumentenprüfung. Dies ist eine einmalige Zahlung, die die Verifizierungskosten deckt.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
