# Analytics Service - Анализ подозрительных ставок

Отдельный сервис для анализа подозрительной активности на аукционах Wolmar.

## 🚀 Запуск

### Локальная разработка
```bash
# Установка зависимостей
npm install --package-lock-only analytics-package.json

# Запуск в режиме разработки
npm run dev

# Или обычный запуск
npm start
```

### Продакшн с PM2
```bash
# Запуск через PM2
npm run pm2:start

# Остановка
npm run pm2:stop

# Перезапуск
npm run pm2:restart

# Просмотр логов
npm run pm2:logs
```

## 📊 Функциональность

### API Endpoints

1. **`GET /api/analytics/dashboard-stats`** - Общая статистика дашборда
2. **`GET /api/analytics/fast-manual-bids`** - Анализ быстрых ручных ставок
3. **`GET /api/analytics/autobid-traps`** - Анализ ловушек автобида
4. **`GET /api/analytics/time-patterns`** - Анализ временных паттернов
5. **`GET /api/analytics/bid-ratios`** - Анализ соотношения ставок
6. **`GET /api/analytics/bidder-conflicts`** - Анализ конфликтов ставщиков
7. **`GET /api/analytics/suspicious-scoring`** - Скоринг подозрительности

### Веб-интерфейс

- **URL**: `http://localhost:3002/analytics`
- Современный responsive дизайн
- Интерактивные таблицы с фильтрацией
- Система скоринга рисков
- Визуализация данных

## 🔧 Настройка

### Переменные окружения
```bash
ANALYTICS_PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/wolmar_parser
NODE_ENV=production
```

### Nginx конфигурация
Добавить в nginx.conf:
```nginx
location /analytics/ {
    proxy_pass http://localhost:3002/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 📈 Анализируемые паттерны

### 1. Быстрые ручные ставки
- Ставки с интервалом < 5 секунд
- Подозрительно быстрые реакции
- Возможные боты

### 2. Ловушки автобида
- Ручные ставки = финальная цена
- Ручные ставки = финальная цена - 1
- Подозрительная точность

### 3. Временные паттерны
- Ночные ставки (22:00-06:00)
- Ставки в выходные
- Регулярные интервалы

### 4. Соотношения ставок
- Высокий процент ручных ставок (>80%)
- Аномальные паттерны использования автобида

### 5. Конфликты ставщиков
- Постоянные перебивания между двумя пользователями
- Подозрительные "войны ставок"

### 6. Скоринг рисков
- Комплексная оценка подозрительности
- Уровни риска: НИЗКИЙ, СРЕДНИЙ, ВЫСОКИЙ

## 🛡️ Безопасность

- Отдельный сервис не влияет на основной сайт
- CORS настроен для безопасного доступа
- Graceful shutdown при завершении
- Логирование всех операций

## 📝 Логирование

Сервис логирует:
- Подключения к БД
- Ошибки API
- Статистику запросов
- Критические события

## 🔄 Интеграция

Сервис работает независимо от основного приложения:
- Отдельный порт (3002)
- Отдельная база данных (та же, что и основное приложение)
- Отдельные логи PM2
- Отдельная конфигурация Nginx

## 🚨 Мониторинг

Для мониторинга используйте:
```bash
# Статус PM2
pm2 status analytics-service

# Логи в реальном времени
pm2 logs analytics-service --lines 100

# Мониторинг ресурсов
pm2 monit
```
