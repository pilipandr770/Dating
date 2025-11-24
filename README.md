# LoveMatch Dating Platform

Платформа для знакомств на немецком языке с поддержкой разных типов целей знакомства и встроенным ИИ-ассистентом.

## Структура проекта

```
dating/
├── backend/          # Flask API
│   ├── app/
│   │   ├── models.py
│   │   ├── events.py
│   │   ├── routes/
│   │   └── services/
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Запуск проекта

### 1. Backend (Python Flask)

Откройте первый терминал:

```bash
# Перейдите в папку backend
cd backend

# Активируйте виртуальное окружение
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Запустите сервер
python run.py
```

Backend запустится на http://localhost:5000

### 2. Frontend (React + Vite)

Откройте второй терминал:

```bash
# Перейдите в папку frontend
cd frontend

# Запустите dev server
npm run dev
```

Frontend запустится на http://localhost:3000

### 3. Откройте приложение

Откройте браузер и перейдите на http://localhost:3000

## Возможности

- Регистрация с выбором цели знакомства (отношения, дружба, интим-услуги, разовые встречи)
- Поиск и матчинг пользователей
- Чат с ИИ-помощником
- Верификация для секс-работников с интеграцией Stripe
- Подписки (Free, Standard, Premium)
- Совместный просмотр фильмов
- Обнаружение мошенничества

## Технологии

### Backend
- Flask 2.3.2
- SQLAlchemy 2.0.21
- Flask-SocketIO 5.3.4 (WebSocket)
- Stripe API (платежи)
- OpenAI API (ИИ-ассистент)

### Frontend
- React 18.2.0
- Vite 5.0.0
- React Router 6.17.0
- Tailwind CSS 3.3.0
- Zustand 4.4.1 (state management)
- Socket.IO Client 4.7.0

## Следующие шаги

1. Настройте `.env` файлы:
   - `backend/.env` - добавьте API ключи для Stripe и OpenAI
   - `frontend/.env` - добавьте публичный ключ Stripe

2. Заполните проектные файлы контентом из вашей предыдущей работы

3. Создайте базу данных (автоматически создается при первом запуске backend)

## Поддержка

Для вопросов и предложений создайте issue в репозитории.
