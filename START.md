# ЗАПУСК ПРОЕКТА LOVEMATCH

## ВСЕ ГОТОВО! API ключи добавлены ✓

### Ваша конфигурация:
- ✓ OpenAI API ключ добавлен в backend/.env
- ✓ Stripe Secret Key добавлен в backend/.env
- ✓ Stripe Public Key добавлен в frontend/.env
- ✓ Все зависимости установлены
- ✓ База данных SQLite настроена

## ЗАПУСК ЗА 3 ШАГА:

### 1. Запустите Backend (Терминал 1):

```bash
cd C:\Users\ПК\dating\backend
venv\Scripts\activate
python run.py
```

**Вы увидите:**
```
Backend starting on http://localhost:5000
```

### 2. Запустите Frontend (Терминал 2):

```bash
cd C:\Users\ПК\dating\frontend
npm run dev
```

**Вы увидите:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:3000
```

### 3. Откройте браузер:

```
http://localhost:3000
```

## ЧТО РАБОТАЕТ:

- ✓ Backend Flask API на порту 5000
- ✓ Frontend React на порту 3000
- ✓ OpenAI интеграция для ИИ-помощника
- ✓ Stripe для платежей
- ✓ WebSocket для real-time чата
- ✓ База данных SQLite

## СТРУКТУРА ПРОЕКТА:

```
C:\Users\ПК\dating\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── events.py
│   │   ├── routes/
│   │   └── services/
│   ├── config.py
│   ├── run.py
│   ├── .env (с вашими ключами!)
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── utils/
│   ├── .env (с вашим Stripe ключом!)
│   └── node_modules/
└── README.md
```

## СЛЕДУЮЩИЕ ШАГИ:

1. Запустите проект (инструкции выше)
2. Протестируйте регистрацию и вход
3. Добавьте контент из вашей предыдущей работы
4. Начните разработку!

## ПОЛЕЗНЫЕ КОМАНДЫ:

```bash
# Остановить backend: Ctrl+C в терминале
# Остановить frontend: Ctrl+C в терминале

# Пересоздать базу данных:
cd backend
rm dating.db
python run.py

# Переустановить frontend зависимости:
cd frontend
rm -rf node_modules
npm install
```

ГОТОВО К ЗАПУСКУ!
