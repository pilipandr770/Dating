# Database Configuration

## ✓ PostgreSQL база данных настроена!

### Подключение:
```
Host: dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com
Database: ittoken_db
User: ittoken_db_user
Schema: dating
```

### Что было настроено:

1. **backend/.env** - добавлена PostgreSQL URL и схема:
   ```
   DATABASE_URL=postgresql://...
   DATABASE_SCHEMA=dating
   ```

2. **config.py** - настроен search_path для PostgreSQL:
   - Автоматически устанавливает схему `dating` для всех запросов
   - Работает и с SQLite для локальной разработки

3. **app/__init__.py** - автоматическое создание схемы:
   - При запуске приложения автоматически создается схема `dating`
   - Выполняется `CREATE SCHEMA IF NOT EXISTS dating`

4. **app/models.py** - все модели используют схему:
   - User -> `dating.users`
   - Match -> `dating.matches`
   - Chat -> `dating.chats`
   - Foreign keys правильно ссылаются на схему

### Как это работает:

```python
# При запуске приложения:
1. Создается схема "dating" (если не существует)
2. Все таблицы создаются в схеме "dating"
3. Все запросы идут в схему "dating"
```

### Структура базы данных:

```
ittoken_db (database)
├── public (schema) - другие проекты
├── dating (schema) - ваш проект
│   ├── users
│   ├── matches
│   └── chats
└── other_schemas - другие проекты
```

### Изоляция данных:

✓ Каждый проект в своей схеме
✓ Нет конфликтов между таблицами
✓ Безопасное хранение данных
✓ Легкое управление проектами

### Проверка подключения:

После запуска backend вы увидите:
```
✓ Schema "dating" created or already exists
✓ Database tables created
Backend starting on http://localhost:5000
```

### Для локальной разработки:

Можете использовать SQLite, просто замените в `.env`:
```
DATABASE_URL=sqlite:///dating.db
# DATABASE_SCHEMA=dating  # не нужно для SQLite
```

Проект автоматически определит тип БД и будет работать корректно!

## Готово к запуску!

Просто запустите backend:
```bash
cd backend
venv\Scripts\activate
python run.py
```

Схема `dating` создастся автоматически при первом запуске!
