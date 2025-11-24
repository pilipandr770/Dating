#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MEGA СКРИПТ: Создаёт ВЕСЬ проект LoveMatch в одну команду!
Использование: python create_project.py

Скачайте этот файл и выполните - готово!
"""

import os
import sys
from pathlib import Path

def create_file(path, content):
    """Создаёт файл с содержимым"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ {path}")

def main():
    print("🚀 СОЗДАНИЕ ПРОЕКТА LoveMatch...")
    print("=" * 50)
    print()

    # ==================== BACKEND FILES ====================

    print("📦 Создание BACKEND файлов...")
    print()

    # backend/config.py
    create_file('backend/config.py', '''import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dating.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    STRIPE_API_KEY = os.getenv('STRIPE_API_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    SUBSCRIPTION_PLANS = {
        'free': {'name': 'Бесплатный', 'price': 0, 'ai_assistant': False, 'cinema': False, 'booking': False, 'max_matches': 10},
        'standard': {'name': 'Стандартный', 'price': 9.99, 'ai_assistant': True, 'cinema': True, 'booking': False, 'max_matches': 50},
        'premium': {'name': 'Премиум', 'price': 19.99, 'ai_assistant': True, 'cinema': True, 'booking': True, 'max_matches': -1}
    }

config = {'development': Config, 'default': Config}
''')

    # backend/run.py
    create_file('backend/run.py', '''import os
from dotenv import load_dotenv
from app import create_app

load_dotenv()

app, socketio = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    print("🚀 Backend запускается на http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
''')

    # backend/requirements.txt
    create_file('backend/requirements.txt', '''Flask==2.3.2
Flask-SQLAlchemy==3.0.5
Flask-JWT-Extended==4.4.4
Flask-CORS==4.0.0
Flask-SocketIO==5.3.4
python-socketio==5.9.0
python-engineio==4.7.1
psycopg2-binary==2.9.7
SQLAlchemy==2.0.21
Werkzeug==2.3.7
python-dotenv==1.0.0
stripe==5.15.0
openai==1.3.0
requests==2.31.0
gunicorn==21.2.0
gevent==23.9.1
gevent-websocket==0.10.1
pydantic==2.5.0
python-dateutil==2.8.2
''')

    # backend/.env
    create_file('backend/.env', '''FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///dating.db
STRIPE_API_KEY=sk_test_fake_key
STRIPE_WEBHOOK_SECRET=whsec_test_webhook_secret
OPENAI_API_KEY=sk-fake-openai-key
SOCKETIO_MESSAGE_QUEUE=redis://localhost:6379
''')

    # backend/app/__init__.py
    create_file('backend/app/__init__.py', '''from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from config import config
from app.models import db

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio = SocketIO(app, cors_allowed_origins="*")

    with app.app_context():
        db.create_all()

    return app, socketio
''')

    # backend/app/models.py (СОКРАЩЁННАЯ версия для примера)
    create_file('backend/app/models.py', '''from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    goal = db.Column(db.String(20), nullable=False)
    subscription_plan = db.Column(db.String(20), default='free')
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    city = db.Column(db.String(120))
    bio = db.Column(db.Text)
    email_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Match(db.Model):
    __tablename__ = 'matches'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = db.Column(db.String(36), db.ForeignKey('matches.id'))
    message = db.Column(db.Text)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
''')

    # backend/app/events.py
    create_file('backend/app/events.py', '''from flask_socketio import emit, join_room, leave_room

def init_socketio_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print(f'Client connected')
        emit('connection_response', {'data': 'Connected'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected')
''')

    # backend/app/routes/__init__.py
    create_file('backend/app/routes/__init__.py', '''from flask import Blueprint

auth_bp = Blueprint('auth', __name__)
user_bp = Blueprint('user', __name__)
match_bp = Blueprint('match', __name__)
chat_bp = Blueprint('chat', __name__)
payment_bp = Blueprint('payment', __name__)

@auth_bp.route('/test', methods=['GET'])
def test():
    return {'message': 'API works!'}
''')

    # Создание остальных пустых файлов routes
    for file in ['auth.py', 'user.py', 'match.py', 'chat.py', 'payment.py']:
        create_file(f'backend/app/routes/{file}', f'# {file}\n# API маршруты для {file.replace(".py", "")}\n')

    # backend/app/services/ai_service.py
    create_file('backend/app/services/ai_service.py', '''# ИИ сервис
class AIAssistant:
    def generate_response_suggestion(self, conversation_history, user_goal):
        return "ИИ предложение (OpenAI интеграция)"

    def detect_threats(self, message):
        return {'is_threat': False, 'threat_type': None}

ai_assistant = AIAssistant()
''')

    print()
    print("⚛️  Создание FRONTEND файлов...")
    print()

    # ==================== FRONTEND FILES ====================

    # frontend/package.json
    create_file('frontend/package.json', '''{
  "name": "dating-platform-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.17.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^1.46.0",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.292.0",
    "date-fns": "^2.30.0",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
''')

    # frontend/vite.config.js
    create_file('frontend/vite.config.js', '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
''')

    # frontend/tailwind.config.js
    create_file('frontend/tailwind.config.js', '''export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4'
      }
    }
  },
  plugins: []
}
''')

    # frontend/postcss.config.js
    create_file('frontend/postcss.config.js', '''export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
''')

    # frontend/index.html
    create_file('frontend/index.html', '''<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LoveMatch - Finden Sie Ihre perfekte Übereinstimmung</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
''')

    # frontend/.env
    create_file('frontend/.env', '''VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_fake_key
''')

    # frontend/src/main.jsx
    create_file('frontend/src/main.jsx', '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
''')

    # frontend/src/App.jsx
    create_file('frontend/src/App.jsx', '''import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>🎉 Добро пожаловать в LoveMatch!</div>} />
      </Routes>
    </BrowserRouter>
  )
}
''')

    # frontend/src/index.css
    create_file('frontend/src/index.css', '''@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
''')

    # Создание страниц
    pages = [
        'LoginPage', 'RegisterPage', 'DiscoverPage', 'MatchesPage',
        'ChatPage', 'ProfilePage', 'DashboardPage', 'CinemaPage',
        'SubscriptionPage', 'VerificationPage'
    ]

    for page in pages:
        create_file(f'frontend/src/pages/{page}.jsx', f'''export default function {page}() {{
  return <div>{page}</div>
}}
''')

    # Компоненты
    create_file('frontend/src/components/Layout.jsx', '''export default function Layout() {
  return <div>Layout Component</div>
}
''')

    create_file('frontend/src/components/ProtectedRoute.jsx', '''export default function ProtectedRoute() {
  return <div>Protected Route</div>
}
''')

    # Состояние
    create_file('frontend/src/store/authStore.js', '''import create from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (email, password) => {},
  logout: () => set({ user: null, token: null })
}))
''')

    # Utils
    create_file('frontend/src/utils/api.js', '''import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

export default api
''')

    # i18n
    create_file('frontend/src/i18n/de.js', '''export const de = {
  auth: {
    login: 'Anmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort'
  },
  common: {
    welcome: 'Willkommen zu LoveMatch!'
  }
}
''')

    print()
    print("=" * 50)
    print("✅ ПРОЕКТ УСПЕШНО СОЗДАН!")
    print("=" * 50)
    print()
    print("📂 Структура:")
    print("dating_platform/")
    print("├── backend/")
    print("│   ├── app/")
    print("│   ├── venv/")
    print("│   ├── config.py")
    print("│   ├── run.py")
    print("│   ├── requirements.txt")
    print("│   └── .env")
    print("├── frontend/")
    print("│   ├── src/")
    print("│   ├── node_modules/")
    print("│   ├── package.json")
    print("│   └── .env")
    print()
    print("🚀 Дальше:")
    print()
    print("1. Backend:")
    print("   cd backend")
    print("   python -m venv venv")
    print("   source venv/bin/activate  # или venv\\Scripts\\activate на Windows")
    print("   pip install -r requirements.txt")
    print("   python run.py")
    print()
    print("2. Frontend (в новом терминале):")
    print("   cd frontend")
    print("   npm install")
    print("   npm run dev")
    print()
    print("3. Откройте: http://localhost:3000")
    print()

if __name__ == '__main__':
    main()
