import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, X, Upload, ArrowLeft, Save } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

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
      setError('Не удалось загрузить данные профиля');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Можно загрузить максимум ${MAX_PHOTOS} фотографий`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedUrls = [];

      for (const file of files) {
        // Проверка размера файла (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`Файл ${file.name} слишком большой. Максимум 5MB`);
          continue;
        }

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
          setError(`Файл ${file.name} не является изображением`);
          continue;
        }

        // Конвертируем в base64 для простоты (в продакшене используйте S3/Cloudinary)
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(base64);
      }

      setPhotos([...photos, ...uploadedUrls]);
      setSuccess('Фото успешно загружены');
    } catch (err) {
      setError('Ошибка при загрузке фотографий');
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
      // В реальном приложении создайте endpoint /api/user/profile для обновления профиля
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        age_min: parseInt(formData.age_min),
        age_max: parseInt(formData.age_max),
        photos: photos,
      };

      // Временно используем прямой axios запрос
      // TODO: добавить метод updateProfile в authAPI
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

      setSuccess('Профиль успешно обновлен!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError('Ошибка при обновлении профиля');
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
            Назад
          </Link>
          <h1 className="text-2xl font-bold text-pink-600">LoveMatch</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Редактировать профиль</h2>

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
            {/* Photo Upload Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Фотографии ({photos.length}/{MAX_PHOTOS})
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
                        Главное фото
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
                      <div className="text-gray-400">Загрузка...</div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Добавить фото</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Первое фото будет использоваться как главное. Максимум 5MB на фото.
              </p>
            </div>

            {/* Basic Info */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Основная информация</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Имя</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Фамилия</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Возраст *</label>
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
                  <label className="block text-sm font-medium mb-1">Пол *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Выберите</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Город *</label>
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
              <h3 className="text-xl font-semibold mb-4">О себе</h3>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows="4"
                placeholder="Расскажите о себе..."
              />
            </div>

            {/* Preferences */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Предпочтения</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Кого ищете *</label>
                  <select
                    name="looking_for_gender"
                    value={formData.looking_for_gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Выберите</option>
                    <option value="male">Мужчин</option>
                    <option value="female">Женщин</option>
                    <option value="both">Всех</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Возраст от</label>
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
                  <label className="block text-sm font-medium mb-1">Возраст до</label>
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
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  'Сохранение...'
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Сохранить изменения
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
