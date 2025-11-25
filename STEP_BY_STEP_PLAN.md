# LoveMatch - Пошаговый План Реализации

## Phase 1: Core Foundation (Сейчас)

### Step 1: Database Migration ✓
- [x] Расширить User модель
- [x] Добавить поля для AI, service providers, trust score
- [ ] Создать migration скрипт
- [ ] Применить к PostgreSQL

### Step 2: Backend Authentication API ✓
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/me
- [ ] Протестировать endpoints

### Step 3: Frontend Landing Page
- [ ] Создать Hero секцию с объяснением
- [ ] Секция "Как это работает"
- [ ] Секция "4 типа знакомств" с карточками
- [ ] Секция "Наши преимущества" (AI, безопасность)
- [ ] Секция "Тарифные планы"
- [ ] CTA кнопка "Зарегистрироваться"

### Step 4: Registration Flow - Goal Selection
- [ ] Страница выбора цели (4 карточки)
- [ ] Relationship card
- [ ] Friendship card
- [ ] Intimate Services card (с пометкой о верификации)
- [ ] Casual card

### Step 5: Registration Flow - Basic Info
- [ ] Email + Password
- [ ] Username
- [ ] Age, Gender
- [ ] City
- [ ] Валидация форм

### Step 6: Registration Flow - Preferences
- [ ] Looking for (gender)
- [ ] Age range
- [ ] Distance radius
- [ ] Bio (optional)

### Step 7: Registration Flow - Service Provider Specific
- [ ] Условное отображение для intimate_services
- [ ] Business name
- [ ] Hourly rate
- [ ] Services offered (чекбоксы)
- [ ] Info о необходимости верификации

### Step 8: Login Page
- [ ] Email + Password форма
- [ ] "Forgot password" link
- [ ] Link to registration
- [ ] Error handling

---

## Phase 2: User Dashboard (После Phase 1)

### Step 9: Dashboard Routing
- [ ] Routing по goal типу
- [ ] RelationshipDashboard
- [ ] FriendshipDashboard
- [ ] ServiceProviderDashboard
- [ ] CasualDashboard

### Step 10: Profile Page
- [ ] View profile
- [ ] Edit profile
- [ ] Upload photos
- [ ] AI settings toggle
- [ ] Trust score display

### Step 11: Subscription Page
- [ ] Display current plan
- [ ] Plan comparison cards
- [ ] Upgrade button
- [ ] Features list per plan

---

## Phase 3: Matching System

### Step 12: Match Algorithm Backend
- [ ] GET /api/match/suggestions
- [ ] Filter by preferences
- [ ] Distance calculation
- [ ] Exclude already matched/passed

### Step 13: Match UI
- [ ] Swipe interface (Tinder-style)
- [ ] Like button
- [ ] Pass button
- [ ] View profile modal

### Step 14: Matches List
- [ ] GET /api/match/list
- [ ] Display matched users
- [ ] Start chat button

---

## Phase 4: Chat System

### Step 15: Basic Chat Backend
- [ ] POST /api/chat/send
- [ ] GET /api/chat/messages/:match_id
- [ ] WebSocket setup

### Step 16: Chat UI
- [ ] Chat list (conversations)
- [ ] Chat window
- [ ] Real-time messages
- [ ] Message status (sent/read)

### Step 17: AI Chat Analysis
- [ ] OpenAI integration
- [ ] Fraud detection trigger
- [ ] Warning display
- [ ] Suggestion sidebar (toggle)

---

## Phase 5: AI Features

### Step 18: AI Assistant Service
- [ ] POST /api/ai/analyze-message
- [ ] OpenAI prompt engineering
- [ ] Response suggestion
- [ ] Tone analysis

### Step 19: Fraud Detection
- [ ] Money request detection
- [ ] Link detection
- [ ] Aggressive behavior
- [ ] Bot detection patterns

### Step 20: AI UI Components
- [ ] Suggestion sidebar
- [ ] Toggle AI on/off
- [ ] Warning modal
- [ ] Trust score impact

---

## Phase 6: Payment System

### Step 21: Stripe Subscriptions
- [ ] POST /api/payment/create-subscription
- [ ] Stripe integration
- [ ] Webhook handler
- [ ] Cancel subscription

### Step 22: Stripe Connect (Service Providers)
- [ ] POST /api/payment/create-connect-account
- [ ] Onboarding flow
- [ ] Payout settings
- [ ] Commission calculation

### Step 23: Booking System
- [ ] POST /api/booking/create
- [ ] Calendar view
- [ ] Payment intent
- [ ] Confirmation flow

---

## Phase 7: Safety & Verification

### Step 24: Email Verification
- [ ] Send verification email
- [ ] Verification link/code
- [ ] Mark as verified
- [ ] Trust score +10

### Step 25: ID Verification (Service Providers)
- [ ] Upload ID photo
- [ ] Admin review interface
- [ ] Approve/Reject
- [ ] Trust score +20

### Step 26: Report System
- [ ] POST /api/safety/report-user
- [ ] Report form
- [ ] Admin dashboard
- [ ] Auto-ban logic

---

## Phase 8: Premium Features

### Step 27: Cinema Feature
- [ ] POST /api/cinema/create-session
- [ ] WebSocket sync
- [ ] Video player component
- [ ] Chat during viewing

### Step 28: Advanced Features
- [ ] Video chat (WebRTC)
- [ ] Disappearing messages
- [ ] Read receipts
- [ ] Typing indicators

---

## Phase 9: Admin Panel

### Step 29: Admin Authentication
- [ ] Admin role in User model
- [ ] Admin login
- [ ] Protected routes

### Step 30: Admin Dashboard
- [ ] User management
- [ ] Report review
- [ ] Trust score management
- [ ] Ban/Unban users

---

## Phase 10: Polish & Deploy

### Step 31: Testing
- [ ] Unit tests (backend)
- [ ] Integration tests
- [ ] E2E tests (frontend)
- [ ] Security audit

### Step 32: Legal Pages
- [ ] Impressum
- [ ] Datenschutz (Privacy Policy)
- [ ] AGB (Terms of Service)
- [ ] Cookie consent

### Step 33: Deployment
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure domain
- [ ] SSL certificates
- [ ] Environment variables

---

## Current Sprint: Steps 3-8

Фокус на создании Registration Flow с красивым UI.

### Сейчас делаю:
1. Landing Page (Step 3)
2. Goal Selection (Step 4)
3. Registration Form (Steps 5-7)
4. Login Page (Step 8)

## Estimated Timeline:
- Phase 1 (Steps 1-8): 3-4 дня
- Phase 2 (Steps 9-11): 2 дня
- Phase 3 (Steps 12-14): 2 дня
- Phase 4 (Steps 15-17): 3 дня
- Phase 5 (Steps 18-20): 3 дня
- Phase 6 (Steps 21-23): 4 дня
- Phase 7 (Steps 24-26): 2 дня
- Phase 8 (Steps 27-28): 3 дня
- Phase 9 (Steps 29-30): 2 дня
- Phase 10 (Steps 31-33): 3 дня

**Total: ~27 дней (1 месяц)**
