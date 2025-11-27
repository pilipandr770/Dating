import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, X, Upload, ArrowLeft, Save, Shield, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { authAPI } from '../utils/api';
import axios from 'axios';

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Verification state
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    city: '',
    bio: '',
    looking_for_gender: '',
    age_min: 18,
    age_max: 100,
  });

  const [photos, setPhotos] = useState([]);
  const MAX_PHOTOS = 6;

  useEffect(() => {
    fetchUserData();
    fetchVerificationStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getMe();
      const user = response.data.user;
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        age: user.age || '',
        gender: user.gender || '',
        city: user.city || '',
        bio: user.bio || '',
        looking_for_gender: user.looking_for_gender || '',
        age_min: user.age_min || 18,
        age_max: user.age_max || 100,
      });
      setPhotos(user.photos || []);
    } catch (err) {
      setError('Profildaten konnten nicht geladen werden');
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

  const startVerification = async () => {
    setVerificationLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/verification/create-session',
        {},
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      );
      
      // Redirect to Stripe Identity verification
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen der Verifizierungssitzung');
      setVerificationLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximal ${MAX_PHOTOS} Fotos erlaubt`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedUrls = [];

      for (const file of files) {
        // Dateigröße prüfen (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`Datei ${file.name} ist zu groß. Maximal 5MB`);
          continue;
        }

        // Dateityp prüfen
        if (!file.type.startsWith('image/')) {
          setError(`Datei ${file.name} ist kein Bild`);
          continue;
        }

        // In base64 konvertieren für Einfachheit (im Produktiveinsatz S3/Cloudinary verwenden)
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(base64);
      }

      setPhotos([...photos, ...uploadedUrls]);
      setSuccess('Fotos erfolgreich hochgeladen');
    } catch (err) {
      setError('Fehler beim Hochladen der Fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // In einer echten Anwendung erstellen Sie den Endpoint /api/user/profile zum Aktualisieren des Profils
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        age_min: parseInt(formData.age_min),
        age_max: parseInt(formData.age_max),
        photos: photos,
      };

      // Vorübergehend direkte axios-Anfrage verwenden
      // TODO: updateProfile-Methode zu authAPI hinzufügen
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profil erfolgreich aktualisiert!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError('Fehler beim Aktualisieren des Profils');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <h1 className="text-2xl font-bold text-pink-600">LoveMatch</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Profil bearbeiten</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Identity Verification Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                  verificationStatus?.identity_verified && verificationStatus?.identity_age_verified
                    ? 'bg-green-100'
                    : verificationStatus?.identity_verification_status === 'pending'
                      ? 'bg-yellow-100'
                      : 'bg-pink-100'
                }`}>
                  {verificationStatus?.identity_verified && verificationStatus?.identity_age_verified ? (
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  ) : verificationStatus?.identity_verification_status === 'pending' ? (
                    <Clock className="w-7 h-7 text-yellow-600" />
                  ) : (
                    <Shield className="w-7 h-7 text-pink-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    Identitätsverifizierung
                    {verificationStatus?.identity_verified && verificationStatus?.identity_age_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ✓ Bestätigt
                      </span>
                    )}
                  </h3>
                  
                  {verificationStatus?.identity_verified && verificationStatus?.identity_age_verified ? (
                    <div>
                      <p className="text-green-700 mb-2">
                        Ihre Identität und Ihr Alter (18+) sind bestätigt. Sie können alle Plattformfunktionen nutzen.
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {verificationStatus.identity_verified_at && (
                          <span>Datum: {new Date(verificationStatus.identity_verified_at).toLocaleDateString('de-DE')}</span>
                        )}
                        {verificationStatus.identity_document_type && (
                          <span>Dokument: {verificationStatus.identity_document_type.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>
                  ) : verificationStatus?.identity_verification_status === 'pending' ? (
                    <div>
                      <p className="text-yellow-700 mb-3">
                        Verifizierung läuft. Bitte schließen Sie die Dokumentenprüfung ab.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/verification')}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Verifizierung fortsetzen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-3">
                        Für vollen Plattformzugang müssen Sie Ihr Alter (18+) bestätigen. 
                        Dies schützt alle Nutzer vor Betrügern und Bots.
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Shield className="w-4 h-4" />
                          <span>DSGVO-konform</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          <span>Daten bei Stripe gespeichert</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={startVerification}
                        disabled={verificationLoading}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition flex items-center gap-2 font-medium disabled:opacity-50"
                      >
                        {verificationLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Vorbereitung...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            Verifizierung starten — €1,99
                          </>
                        )}
                      </button>
                      
                      {verificationStatus?.verification_attempts > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Versuche: {verificationStatus.verification_attempts}/5
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Warning for unverified users */}
              {!verificationStatus?.identity_verified && verificationStatus?.identity_verification_status !== 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    <strong>Wichtig:</strong> Ohne Verifizierung können Sie keine Profile anderer Nutzer ansehen, 
                    keine Nachrichten senden und keine anderen Plattformfunktionen nutzen.
                  </p>
                </div>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Fotos ({photos.length}/{MAX_PHOTOS})
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                        Hauptfoto
                      </div>
                    )}
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-500 cursor-pointer flex flex-col items-center justify-center transition">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="text-gray-400">Hochladen...</div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Foto hinzufügen</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Erstes Foto wird als Hauptfoto verwendet. Maximal 5MB pro Foto.
              </p>
            </div>

            {/* Basic Info */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Grundlegende Informationen</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vorname</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nachname</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Müller"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alter *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="18"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Geschlecht *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Auswählen</option>
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="other">Andere</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Stadt *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Berlin"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Über mich</h3>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows="4"
                placeholder="Erzählen Sie über sich..."
              />
            </div>

            {/* Preferences */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Präferenzen</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wen suchen Sie? *</label>
                  <select
                    name="looking_for_gender"
                    value={formData.looking_for_gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Auswählen</option>
                    <option value="male">Männer</option>
                    <option value="female">Frauen</option>
                    <option value="both">Alle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alter von</label>
                  <input
                    type="number"
                    name="age_min"
                    value={formData.age_min}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="18"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alter bis</label>
                  <input
                    type="number"
                    name="age_max"
                    value={formData.age_max}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="18"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  'Speichern...'
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Änderungen speichern
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
