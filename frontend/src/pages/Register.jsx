import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    goal: null,
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    age: null,
    gender: '',
    city: '',
    bio: '',
    looking_for_gender: '',
    age_min: 18,
    age_max: 100,
  });

  const handleGoalSelect = (goal) => {
    setFormData({ ...formData, goal });
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateStep = () => {
    setError('');

    if (step === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.username) {
        setError('Bitte füllen Sie alle Pflichtfelder aus');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwörter stimmen nicht überein');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Passwort muss mindestens 8 Zeichen enthalten');
        return false;
      }
    }

    if (step === 3) {
      if (!formData.age || !formData.gender || !formData.city) {
        setError('Bitte füllen Sie alle Pflichtfelder aus');
        return false;
      }
      if (formData.age < 18 || formData.age > 100) {
        setError('Alter muss zwischen 18 und 100 Jahren sein');
        return false;
      }
    }

    if (step === 4) {
      if (!formData.looking_for_gender) {
        setError('Bitte geben Sie an, wen Sie suchen');
        return false;
      }
    }

    if (step === 5 && formData.goal === 'intimate_services') {
      if (!formData.business_name || !formData.hourly_rate) {
        setError('Bitte füllen Sie alle Anbieterfelder aus');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 4 && formData.goal !== 'intimate_services') {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        goal: formData.goal,
        email: formData.email,
        password: formData.password,
        username: formData.username,
        age: parseInt(formData.age),
        gender: formData.gender,
        city: formData.city,
        bio: formData.bio || undefined,
        looking_for_gender: formData.looking_for_gender,
        age_min: parseInt(formData.age_min),
        age_max: parseInt(formData.age_max),
      };

      if (formData.goal === 'intimate_services') {
        payload.business_name = formData.business_name;
        payload.hourly_rate = parseFloat(formData.hourly_rate);
      }

      const response = await authAPI.register(payload);
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrierungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrierung</h1>
            <p className="text-gray-600">Schritt {step} von {formData.goal === 'intimate_services' ? '5' : '4'}</p>
          </div>

          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-pink-600 rounded-full transition-all"
                style={{ width: `${(step / (formData.goal === 'intimate_services' ? 5 : 4)) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Wählen Sie Ihr Kennenlernen-Ziel</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <GoalButton
                  icon={<Heart className="w-8 h-8 text-red-500" />}
                  title="Beziehung"
                  description="Langfristige Beziehung"
                  onClick={() => handleGoalSelect('relationship')}
                />
                <GoalButton
                  icon={<Users className="w-8 h-8 text-blue-500" />}
                  title="Freundschaft"
                  description="Neue Freunde"
                  onClick={() => handleGoalSelect('friendship')}
                />
                <GoalButton
                  icon={<Heart className="w-8 h-8 text-pink-500" />}
                  title="Intimdienste"
                  description="Legale Dienstleistungen"
                  badge="Verifizierung"
                  onClick={() => handleGoalSelect('intimate_services')}
                />
                <GoalButton
                  icon={<Heart className="w-8 h-8 text-purple-500" />}
                  title="Gelegentliche Treffen"
                  description="Casual Dating"
                  onClick={() => handleGoalSelect('casual')}
                />
              </div>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-pink-600 hover:underline">
                  Bereits ein Konto? Anmelden
                </Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Grundlegende Informationen</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-Mail *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Benutzername *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="username123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passwort *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Mindestens 8 Zeichen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passwort bestätigen *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Passwort wiederholen"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Zurück
                </button>
                <button onClick={handleNext} className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center">
                  Weiter
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Persönliche Daten</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Alter *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="18+"
                    min="18"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Geschlecht *</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" required>
                    <option value="">Geschlecht wählen</option>
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="other">Andere</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stadt *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Berlin" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Über mich (optional)</label>
                  <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Erzählen Sie über sich..." rows={4} />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Zurück
                </button>
                <button onClick={handleNext} className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center">
                  Weiter
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Präferenzen</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wen suchen Sie? *</label>
                  <select name="looking_for_gender" value={formData.looking_for_gender} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" required>
                    <option value="">Auswählen</option>
                    <option value="male">Männer</option>
                    <option value="female">Frauen</option>
                    <option value="both">Alle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alter von</label>
                  <input type="number" name="age_min" value={formData.age_min} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" min="18" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alter bis</label>
                  <input type="number" name="age_max" value={formData.age_max} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" min="18" max="100" />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Zurück
                </button>
                <button onClick={formData.goal === 'intimate_services' ? handleNext : handleSubmit} disabled={loading} className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center disabled:opacity-50">
                  {loading ? 'Laden...' : (formData.goal === 'intimate_services' ? 'Weiter' : 'Registrieren')}
                  {!loading && <ChevronRight className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </div>
          )}

          {step === 5 && formData.goal === 'intimate_services' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Anbieterinformationen</h2>
              <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  Für Intimdienstleister ist eine Verifizierung erforderlich. Nach der Registrierung müssen Sie Dokumente einreichen.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Geschäftsname *</label>
                  <input type="text" name="business_name" value={formData.business_name || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Studioname/Name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stundensatz (€) *</label>
                  <input type="number" name="hourly_rate" value={formData.hourly_rate || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="100" min="0" required />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Zurück
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center disabled:opacity-50">
                  {loading ? 'Laden...' : 'Registrieren'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalButton({ icon, title, description, badge, onClick }) {
  return (
    <button onClick={onClick} className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition text-left">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-center mb-1">{title}</h3>
      <p className="text-sm text-gray-600 text-center">{description}</p>
      {badge && (
        <span className="block text-xs text-center bg-yellow-100 text-yellow-800 py-1 px-2 rounded mt-2">
          {badge}
        </span>
      )}
    </button>
  );
}
