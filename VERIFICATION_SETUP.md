# Stripe Identity Verification Setup Guide

## Обзор

Stripe Identity - это система верификации личности, которая позволяет:
- Подтвердить возраст пользователя (18+)
- Защитить платформу от ботов и мошенников
- Соответствовать требованиям GDPR (данные хранятся в Stripe)

## Требования

1. **Stripe Account** с активированным Identity API
2. **Stripe Secret Key** (тестовый или рабочий)
3. **Webhook Endpoint** для получения событий верификации

## Настройка Stripe Dashboard

### 1. Активация Identity

1. Войдите в [Stripe Dashboard](https://dashboard.stripe.com)
2. Перейдите в **Products → Identity**
3. Нажмите **Get started** и заполните форму активации
4. Дождитесь одобрения (обычно мгновенно для тестового режима)

### 2. Настройка Webhook

1. Перейдите в **Developers → Webhooks**
2. Нажмите **Add endpoint**
3. URL: `https://your-domain.com/api/verification/webhook`
4. Выберите события:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
5. Скопируйте **Webhook Signing Secret**

### 3. Настройка .env

```env
# Stripe Identity Verification
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_xxxxx
VERIFICATION_FEE=199  # €1.99 в центах
```

## API Endpoints

### GET /api/verification/status
Получить текущий статус верификации пользователя.

**Response:**
```json
{
  "identity_verified": false,
  "identity_verification_status": "unverified",
  "identity_age_verified": false,
  "verification_attempts": 0,
  "can_use_platform": false
}
```

### POST /api/verification/create-session
Создать сессию верификации Stripe Identity.

**Response:**
```json
{
  "session_id": "vs_xxxxx",
  "client_secret": "vs_xxxxx_secret_xxxxx",
  "url": "https://verify.stripe.com/start/xxxxx",
  "status": "pending",
  "verification_fee": 1.99,
  "currency": "EUR"
}
```

### GET /api/verification/check-session/{session_id}
Проверить статус сессии верификации.

### GET /api/verification/require-check
Проверить, может ли пользователь использовать платформу.

### POST /api/verification/webhook
Webhook для событий Stripe Identity.

## Статусы верификации

| Статус | Описание |
|--------|----------|
| `unverified` | Верификация не начата |
| `pending` | Ожидание действий пользователя |
| `processing` | Документы проверяются |
| `verified` | Верификация успешна |
| `failed` | Верификация не пройдена |
| `cancelled` | Верификация отменена |

## Фронтенд интеграция

### Страница верификации
`/verification` - Основная страница верификации

### Возврат после верификации
`/verification/complete?session_id={CHECKOUT_SESSION_ID}`

### Компонент VerificationGate
```jsx
import VerificationGate from './components/VerificationGate';

// Оберните защищённый контент
<VerificationGate>
  <ProtectedContent />
</VerificationGate>
```

### Hook useVerificationStatus
```jsx
import { useVerificationStatus } from './components/VerificationGate';

const { loading, isVerified, canAccess } = useVerificationStatus();
```

## Тестирование

### Тестовые документы Stripe
В тестовом режиме используйте документы с [Stripe Test Data](https://stripe.com/docs/identity/testing):

- **Успешная верификация**: Загрузите любое изображение документа
- **Требует ввода**: Используйте размытое изображение
- **Отклонено**: Используйте просроченный документ

### Тестовый сценарий

1. Зарегистрируйте нового пользователя
2. Перейдите в `/verification`
3. Нажмите "Начать верификацию"
4. Пройдите процесс в Stripe
5. После возврата проверьте статус

## Безопасность

### GDPR Compliance
- Документы хранятся только в Stripe
- Платформа получает только статус верификации
- Пользователь может запросить удаление данных через Stripe

### Защита от фрода
- Лимит 5 попыток в день
- Требуется живое фото (liveness check)
- Сравнение селфи с фото в документе

## Стоимость

### Stripe Identity Pricing
- €1.50 за успешную верификацию (EU)
- Платит пользователь: €1.99 (с маржой €0.49)

### Настройка цены
```env
VERIFICATION_FEE=199  # Цена в центах
```

## Troubleshooting

### "Payment system not configured"
Проверьте `STRIPE_SECRET_KEY` в `.env`

### "Too many verification attempts"
Пользователь превысил лимит (5/день). Подождите 24 часа.

### Webhook не работает
1. Проверьте URL webhook в Stripe Dashboard
2. Проверьте `STRIPE_IDENTITY_WEBHOOK_SECRET`
3. Убедитесь, что endpoint доступен извне

### Верификация застряла на "pending"
1. Проверьте webhook события в Stripe Dashboard
2. Вручную вызовите `/check-session/{session_id}`

## Дальнейшее развитие

- [ ] Добавить email уведомления о статусе верификации
- [ ] Добавить повторную верификацию через год
- [ ] Интеграция с админ-панелью для ручной проверки
- [ ] Аналитика верификаций
