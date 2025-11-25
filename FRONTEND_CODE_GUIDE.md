# Frontend Implementation Guide

## Текущий Sprint: Landing + Registration

### Структура которую нужно создать:

```
frontend/src/
├── pages/
│   ├── Landing.tsx          ← НОВЫЙ
│   ├── Register.tsx         ← НОВЫЙ
│   ├── Login.tsx            ← НОВЫЙ
│   └── Dashboard.tsx        ← Позже
├── components/
│   ├── Hero.tsx             ← НОВЫЙ
│   ├── Features.tsx         ← НОВЫЙ
│   ├── GoalSelection.tsx    ← НОВЫЙ
│   ├── RegisterForm.tsx     ← НОВЫЙ
│   └── PricingPlans.tsx     ← НОВЫЙ
├── utils/
│   ├── api.ts               ← НОВЫЙ
│   └── auth.ts              ← НОВЫЙ
└── App.tsx                  ← ОБНОВИТЬ
```

---

## Step 1: Установить дополнительные пакеты

```bash
cd frontend
npm install axios react-router-dom zustand lucide-react
```

---

## Step 2: Создать API утилиту

**Файл: `frontend/src/utils/api.ts`**

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};
```

---

## Step 3: Создать Landing Page

**Файл: `frontend/src/pages/Landing.tsx`**

```typescript
import { Link } from 'react-router-dom';
import { Heart, Shield, Brain, Users, Video, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          LoveMatch
        </h1>
        <p className="text-2xl text-gray-600 mb-4">
          Знакомства нового поколения в Германии
        </p>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Выберите свою цель знакомства. Искусственный интеллект защитит вас от мошенников
          и поможет в общении. Безопасно, прозрачно, легально.
        </p>
        <Link
          to="/register"
          className="inline-block bg-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-pink-700 transition"
        >
          Начать знакомство
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-pink-600 hover:underline">
            Войти
          </Link>
        </p>
      </section>

      {/* 4 Types of Dating */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          4 типа знакомств
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GoalCard
            icon={<Heart className="w-12 h-12 text-red-500" />}
            title="Отношения"
            description="Ищете любовь и долгосрочные отношения"
          />
          <GoalCard
            icon={<Users className="w-12 h-12 text-blue-500" />}
            title="Дружба"
            description="Новые друзья и интересные знакомства"
          />
          <GoalCard
            icon={<Heart className="w-12 h-12 text-pink-500" />}
            title="Интим-услуги"
            description="Легальные услуги с верификацией и безопасными платежами"
            badge="Верификация обязательна"
          />
          <GoalCard
            icon={<Heart className="w-12 h-12 text-purple-500" />}
            title="Разовые встречи"
            description="Casual dating без обязательств"
          />
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Наши преимущества
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-10 h-10 text-purple-600" />}
              title="AI Ассистент"
              description="Помощь в общении и умные подсказки для диалогов"
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-green-600" />}
              title="Защита от мошенников"
              description="AI автоматически распознает признаки обмана и предупреждает вас"
            />
            <FeatureCard
              icon={<Video className="w-10 h-10 text-blue-600" />}
              title="Кинотеатр"
              description="Смотрите фильмы вместе онлайн (Premium план)"
            />
            <FeatureCard
              icon={<CheckCircle className="w-10 h-10 text-pink-600" />}
              title="Верификация"
              description="Все провайдеры услуг проходят обязательную проверку"
            />
            <FeatureCard
              icon={<Heart className="w-10 h-10 text-red-600" />}
              title="Trust Score"
              description="Система доверия защищает от подозрительных пользователей"
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-indigo-600" />}
              title="Умный Matching"
              description="Алгоритм подбирает совпадения по вашим предпочтениям"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Тарифные планы
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="€0"
            features={[
              'До 10 совпадений в день',
              'Базовый чат',
              'Профиль с фото',
            ]}
            notIncluded={['AI ассистент', 'Кинотеатр', 'Приоритет в поиске']}
          />
          <PricingCard
            name="Standard"
            price="€9.99"
            popular
            features={[
              'До 50 совпадений в день',
              'AI ассистент',
              'AI защита от мошенников',
              'Кинотеатр',
              'Приоритет в поиске',
            ]}
          />
          <PricingCard
            name="Premium"
            price="€19.99"
            features={[
              'Безлимит совпадений',
              'Все функции Standard',
              'Видео-чат',
              'Исчезающие сообщения',
              'Расширенная аналитика',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl mb-8">
            Присоединяйтесь к LoveMatch сегодня
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            Зарегистрироваться бесплатно
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function GoalCard({ icon, title, description, badge }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <p className="text-gray-600 text-center text-sm mb-2">{description}</p>
      {badge && (
        <span className="block text-xs text-center bg-yellow-100 text-yellow-800 py-1 px-2 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, features, notIncluded, popular }: any) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 ${popular ? 'ring-2 ring-pink-600' : ''}`}>
      {popular && (
        <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm">
          Популярный
        </span>
      )}
      <h3 className="text-2xl font-bold mt-4">{name}</h3>
      <p className="text-4xl font-bold my-4">{price}<span className="text-lg text-gray-500">/мес</span></p>
      <ul className="space-y-3 mb-6">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
        {notIncluded?.map((feature: string, i: number) => (
          <li key={i} className="flex items-start text-gray-400">
            <span className="mr-2">✕</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
        Выбрать план
      </button>
    </div>
  );
}
```

---

## Следующие шаги:

1. Создайте файлы выше
2. Установите пакеты
3. Обновите `App.tsx` с роутингом
4. Создам Registration Flow в следующем сообщении

Готовы продолжить?
