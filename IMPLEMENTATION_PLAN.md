# LoveMatch - Implementation Plan

## Уникальная Концепция

Платформа знакомств для Германии с легальными интим-услугами, AI ассистентом и защитой от мошенничества.

## Ключевые Отличия от Конкурентов

1. **Прозрачность целей** - пользователи сразу выбирают свою цель
2. **Безопасность платежей** - для секс-работников через Stripe Connect
3. **AI защита** - анализ чата на мошенничество и агрессию
4. **AI помощник** - советы по общению (можно включить/выключить)
5. **Верификация** - обязательная для провайдеров услуг
6. **Кинотеатр** - совместный просмотр фильмов для Premium

---

## 1. Типы Пользователей (Goals)

### 1.1 Relationship (Отношения)
- Классический dating
- Поиск долгосрочных отношений
- Matching по интересам
- **Dashboard**: профиль, matches, чат, настройки

### 1.2 Friendship (Дружба)
- Поиск друзей
- Групповые мероприятия
- **Dashboard**: профиль, френды, events, настройки

### 1.3 Intimate Services (Интим-услуги)
- **Провайдеры услуг** (sex workers)
- Обязательная верификация
- Stripe Connect для приема платежей
- Указание услуг и цен
- **Dashboard**: профиль, booking calendar, earnings, верификация, настройки

### 1.4 Casual (Разовые встречи)
- Casual dating/hookups
- Быстрые знакомства
- **Dashboard**: профиль, nearby, чат, настройки

---

## 2. Планы Подписки

###  Free Plan
- Базовый функционал
- До 10 совпадений в день
- Базовый чат
- **Без** AI ассистента
- **Без** кинотеатра

### Standard Plan ($9.99/месяц)
- До 50 совпадений в день
- **AI ассистент** (советы по общению)
- **AI анализ** чата на мошенничество
- **Кинотеатр** - совместный просмотр
- Приоритет в поиске

### Premium Plan ($19.99/месяц)
- **Безлимит** совпадений
- Все функции Standard
- Расширенная аналитика
- Бронирование столиков в ресторанах (будущая функция)
- Видео-чат
- Исчезающие сообщения

---

## 3. AI Функции

### 3.1 AI Ассистент (Standard+)
**Можно включать/выключать**

```python
# Анализирует переписку и дает советы
{
  "message": "Wie gehts?",
  "ai_suggestion": "Вы можете спросить про интересы собеседника, например: 'Was machst du gerne in deiner Freizeit?'",
  "tone_analysis": "casual",
  "confidence": 0.85
}
```

### 3.2 Fraud Detection (Всегда активна)
Автоматически анализирует на:
- Запрос денег
- Подозрительные ссылки
- Агрессивное поведение
- Признаки бота
- Несоответствие профилю

```python
{
  "fraud_detected": true,
  "fraud_type": "money_request",
  "indicators": ["просит деньги", "экстренная ситуация"],
  "risk_level": "high",
  "warning": "ВНИМАНИЕ: Собеседник просит деньги. Это признак мошенничества."
}
```

---

## 4. Stripe Integration

### 4.1 Для Клиентов (Подписки)
```
POST /api/payment/create-subscription
{
  "plan": "standard" | "premium",
  "payment_method_id": "pm_xxx"
}
```

### 4.2 Для Провайдеров Услуг (Stripe Connect)
```
POST /api/payment/create-connect-account
{
  "business_name": "Studio XYZ",
  "tax_id": "DE123456789",
  "bank_account": {...}
}
```

### 4.3 Booking & Payment
```
POST /api/booking/create
{
  "provider_id": "uuid",
  "date": "2024-01-20T14:00:00Z",
  "duration_hours": 2,
  "services": ["service1", "service2"],
  "total_amount": 300
}
```

Платеж идет напрямую провайдеру через Stripe Connect.
Платформа берет комиссию (5-15%).

---

## 5. Верификация

### 5.1 Email Verification (все пользователи)
- Отправка кода на email
- Обязательна для messaging

### 5.2 Phone Verification (опционально)
- SMS код
- Повышает trust_score

### 5.3 ID Verification (обязательна для провайдеров)
- Загрузка фото ID
- Ручная проверка администратором
- Stripe Identity integration

---

## 6. Safety & Trust System

### Trust Score (0-100)
- Начальный: 50
- +10 за email verification
- +10 за phone verification
- +20 за ID verification
- +5 за каждый положительный отзыв
- -20 за каждую жалобу

### Автоблокировка
- Trust score < 20
- 3+ предупреждения от AI
- 2+ жалобы от пользователей

---

## 7. Cinema Feature (Standard+)

```javascript
// Создание сессии
POST /api/cinema/create-session
{
  "guest_id": "uuid",
  "movie_url": "https://youtube.com/watch?v=xxx"
}

// WebSocket sync
{
  "type": "play",
  "timestamp": 125.5
}
```

Синхронизация через WebSocket:
- Play/Pause
- Seek
- Chat во время просмотра

---

## 8. Database Schema

### Users (расширенная)
```sql
users:
  - goal: relationship | friendship | intimate_services | casual
  - subscription_plan: free | standard | premium
  - is_service_provider: boolean
  - service_verified: boolean
  - hourly_rate: float
  - stripe_account_id: string
  - ai_assistant_enabled: boolean
  - trust_score: integer
```

### Новые Таблицы

**service_bookings**
```sql
- id
- provider_id
- client_id
- booking_date
- duration_hours
- total_amount
- payment_intent_id
- status: pending | confirmed | completed | cancelled
```

**ai_analysis**
```sql
- id
- user_id
- chat_id
- analysis_type: suggestion | fraud_detection
- suggestion: text
- fraud_detected: boolean
- fraud_type: string
- confidence_score: float
```

**safety_reports**
```sql
- id
- reporter_id
- reported_user_id
- report_type: spam | harassment | fraud | fake_profile
- description: text
- status: pending | under_review | resolved
```

**cinema_sessions**
```sql
- id
- host_id
- guest_id
- movie_url
- session_token
- status: active | ended
```

---

## 9. API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-verification
```

### User Profile
```
GET /api/user/profile
PUT /api/user/profile
PUT /api/user/ai-settings
GET /api/user/subscription
```

### Matching
```
GET /api/match/suggestions
POST /api/match/like
POST /api/match/pass
GET /api/match/list
```

### Chat
```
GET /api/chat/conversations
GET /api/chat/messages/:match_id
POST /api/chat/send
WebSocket /ws/chat
```

### AI Assistant
```
POST /api/ai/analyze-message
POST /api/ai/get-suggestion
PUT /api/ai/toggle-assistant
```

### Payment
```
POST /api/payment/create-subscription
POST /api/payment/cancel-subscription
POST /api/payment/create-connect-account (providers)
POST /api/payment/update-payout-info
```

### Booking (for intimate services)
```
POST /api/booking/create
GET /api/booking/list
PUT /api/booking/confirm
PUT /api/booking/cancel
GET /api/booking/earnings (providers)
```

### Cinema
```
POST /api/cinema/create-session
GET /api/cinema/join/:token
WebSocket /ws/cinema/:session_id
```

### Safety
```
POST /api/safety/report-user
GET /api/safety/my-reports
```

---

## 10. Frontend Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Register.tsx (с выбором goal)
│   │   └── Login.tsx
│   ├── dashboard/
│   │   ├── RelationshipDashboard.tsx
│   │   ├── FriendshipDashboard.tsx
│   │   ├── ServiceProviderDashboard.tsx
│   │   └── CasualDashboard.tsx
│   ├── chat/
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx (с AI подсказками)
│   │   └── FraudWarning.tsx
│   ├── profile/
│   │   ├── MyProfile.tsx
│   │   ├── Settings.tsx
│   │   └── AISettings.tsx
│   ├── booking/ (для intimate services)
│   │   ├── Calendar.tsx
│   │   ├── BookingForm.tsx
│   │   └── Earnings.tsx
│   ├── cinema/
│   │   ├── CinemaLobby.tsx
│   │   └── CinemaPlayer.tsx
│   └── subscription/
│       └── Plans.tsx
```

---

## 11. Implementation Priority

### Phase 1: Core (2 недели)
1. ✅ Database models
2. ✅ User registration с выбором goal
3. ✅ Login/Auth (JWT)
4. ✅ Basic profile
5. ✅ Email verification

### Phase 2: Matching & Chat (1 неделя)
6. Matching алгоритм
7. Chat с WebSocket
8. Basic AI fraud detection

### Phase 3: AI Features (1 неделя)
9. OpenAI integration
10. Chat analysis
11. AI suggestions
12. Toggle AI on/off

### Phase 4: Payments (1 неделя)
13. Stripe subscriptions
14. Stripe Connect для провайдеров
15. Booking system

### Phase 5: Additional (1 неделя)
16. Cinema feature
17. Safety reports
18. Trust score system
19. Admin panel

---

## 12. Security Considerations

1. **Data Encryption**: все пароли хешированы (bcrypt)
2. **JWT Tokens**: короткий expire time
3. **Rate Limiting**: защита от спама
4. **Input Validation**: все входящие данные проверяются
5. **CORS**: только разрешенные домены
6. **SQL Injection**: использование ORM (SQLAlchemy)
7. **XSS Protection**: sanitization всех user inputs
8. **GDPR Compliance**: возможность удаления данных

---

## 13. Legal Compliance (Германия)

1. **Impressum** - обязательная страница
2. **Datenschutz** (Privacy Policy) - GDPR
3. **AGB** (Terms of Service)
4. **Cookie Consent**
5. **Age Verification** - 18+
6. **Tax Registration** для провайдеров
7. **KYC** (Know Your Customer) для Stripe

---

## Next Steps

1. Implement auth.py с регистрацией
2. Создать Frontend registration flow
3. Настроить OpenAI API
4. Интегрировать Stripe
5. Deploy на Render

Хотите начать с какого-то конкретного модуля?
