# Git Repository Information

## GitHub Repository
**URL:** https://github.com/pilipandr770/Dating.git

## Что сделано:

### ✓ Созданы файлы:
- `.gitignore` - исключает node_modules, venv, .env и другие временные файлы
- `backend/.env.example` - шаблон для переменных окружения backend
- `frontend/.env.example` - шаблон для переменных окружения frontend

### ✓ Git инициализирован:
- Репозиторий инициализирован
- Все файлы добавлены в коммит (кроме .env с секретами)
- Создан initial commit
- Remote добавлен: origin -> https://github.com/pilipandr770/Dating.git
- Ветка переименована в main
- Код загружен в GitHub

### ✓ Что НЕ сохранено в GitHub (правильно):
- `backend/.env` - ваши API ключи в безопасности
- `frontend/.env` - ваши API ключи в безопасности
- `backend/venv/` - виртуальное окружение Python
- `frontend/node_modules/` - зависимости Node.js
- `backend/*.db` - файлы базы данных

## Как клонировать проект на другом компьютере:

```bash
# Клонировать репозиторий
git clone https://github.com/pilipandr770/Dating.git
cd Dating

# Создать .env файлы из примеров
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Отредактировать .env файлы и добавить ваши API ключи

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Запуск
# Terminal 1: cd backend && venv\Scripts\activate && python run.py
# Terminal 2: cd frontend && npm run dev
```

## Полезные Git команды:

```bash
# Посмотреть статус
git status

# Добавить новые изменения
git add .
git commit -m "Описание изменений"
git push

# Обновить с GitHub
git pull

# Посмотреть историю
git log --oneline

# Создать новую ветку
git checkout -b feature-name

# Переключиться на main
git checkout main
```

## ВАЖНО:
- Файлы `.env` с вашими API ключами НЕ загружены в GitHub
- Это правильно - секреты должны оставаться локальными
- При клонировании создайте `.env` файлы заново из `.env.example`

## Commit ID:
524b861 - Initial commit: LoveMatch Dating Platform

Проект успешно сохранен в GitHub!
