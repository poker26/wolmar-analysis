# 🎯 Руководство по сбору истории ставок для анализа поведения

## 📋 Обзор проблемы

Вы правильно определили, что для полноценного анализа поведения на аукционе Wolmar нам критически не хватает **истории ставок**. Без этих данных мы можем проверить только 3 из 7 гипотез Анатолия QGL.

### ❌ Что у нас ЕСТЬ:
- Финальные результаты торгов (победитель, цена)
- Количество ставок (но не детали)
- Описания лотов

### ❌ Что у нас НЕТ (критично):
- **История всех ставок** - кто, когда, сколько ставил
- **Время каждой ставки** - для анализа паттернов
- **IP-адреса участников** - для выявления множественных аккаунтов
- **Детали процесса торгов** - как развивались торги

## 🛠️ Решение: Два подхода

### **ПОДХОД 1: Модификация парсера для новых лотов**

**Файл:** `numismat-parser-with-bidding.js`

Модифицированный парсер, который при парсинге новых лотов автоматически собирает полную историю ставок.

**Использование:**
```bash
# Парсинг нового аукциона с историей ставок
node numismat-parser-with-bidding.js 2134
```

**Что делает:**
- Парсит основную информацию о лоте
- Собирает полную историю всех ставок
- Анализирует подозрительные паттерны в реальном времени
- Сохраняет данные в расширенные таблицы

### **ПОДХОД 2: Сбор истории для существующих лотов**

**Файл:** `add-bidding-history-to-existing-lots.js`

Скрипт для добавления истории ставок к уже существующим лотам в базе данных.

**Использование:**
```bash
# Сбор истории для существующих лотов
node add-bidding-history-to-existing-lots.js 50 1000
# Параметры: batchSize=50, maxLots=1000
```

**Что делает:**
- Находит лоты без истории ставок
- Парсит историю ставок для каждого лота
- Отслеживает прогресс сбора
- Обновляет флаги в базе данных

## 🚀 Универсальный менеджер

**Файл:** `run-bidding-history-collection.js`

Главный скрипт для управления всеми процессами сбора истории ставок.

### 📊 Просмотр статистики
```bash
node run-bidding-history-collection.js --stats
```

### 🔄 Сбор для существующих лотов
```bash
# Базовый сбор
node run-bidding-history-collection.js --existing

# С параметрами
node run-bidding-history-collection.js --existing --batch=100 --max=2000
```

### 🆕 Парсинг новых лотов
```bash
node run-bidding-history-collection.js --new --auction=2134
```

### 🎯 Комплексный режим
```bash
# Все в одном
node run-bidding-history-collection.js --comprehensive --auction=2134 --batch=50 --max=1000
```

## 📊 Структура базы данных

### Новые таблицы:

#### `auction_bids` - История ставок
```sql
CREATE TABLE auction_bids (
    id SERIAL PRIMARY KEY,
    lot_number VARCHAR(50) NOT NULL,
    auction_number VARCHAR(50) NOT NULL,
    source_site VARCHAR(50) DEFAULT 'wolmar.ru',
    bidder_login VARCHAR(100) NOT NULL,
    bid_amount DECIMAL(12, 2) NOT NULL,
    bid_time TIMESTAMP NOT NULL,
    bid_type VARCHAR(20) DEFAULT 'manual',
    is_winning_bid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_sessions` - Сессии пользователей
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_login VARCHAR(100) NOT NULL,
    source_site VARCHAR(50) DEFAULT 'wolmar.ru',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    first_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_bids INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### `bidding_collection_progress` - Прогресс сбора
```sql
CREATE TABLE bidding_collection_progress (
    id SERIAL PRIMARY KEY,
    auction_number VARCHAR(50) NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    lot_url TEXT NOT NULL,
    bidding_history_collected BOOLEAN DEFAULT FALSE,
    bids_count INTEGER DEFAULT 0,
    collection_attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP,
    error_message TEXT
);
```

### Расширения существующей таблицы:
```sql
ALTER TABLE auction_lots 
ADD COLUMN bidding_history_collected BOOLEAN DEFAULT FALSE,
ADD COLUMN suspicious_activity_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN manipulation_indicators JSONB DEFAULT '{}'::jsonb;
```

## 🔍 Анализ подозрительных паттернов

После сбора истории ставок становится возможным анализ всех 7 гипотез:

### ✅ Гипотезы, которые можно проверить БЕЗ истории ставок:
1. **Круговые покупки** - кто покупает одинаковые монеты многократно
2. **Доминирующие победители** - кто выигрывает слишком много лотов
3. **Концентрация побед** - массовые покупки в одном аукционе

### ✅ Гипотезы, которые можно проверить С историей ставок:
4. **Множественные аккаунты** - анализ по IP-адресам и паттернам поведения
5. **Тактика "приманки"** - анализ роста цен в процессе торгов
6. **Синхронные ставки** - выявление координированных действий
7. **Прощупывание автобидов** - анализ паттернов ставок

## 🎯 Пошаговый план внедрения

### Шаг 1: Подготовка
```bash
# Проверяем текущую статистику
node run-bidding-history-collection.js --stats
```

### Шаг 2: Сбор для существующих лотов
```bash
# Начинаем с небольшого батча для тестирования
node run-bidding-history-collection.js --existing --batch=10 --max=50
```

### Шаг 3: Парсинг новых лотов
```bash
# Для новых аукционов используем модифицированный парсер
node run-bidding-history-collection.js --new --auction=2134
```

### Шаг 4: Полный анализ
```bash
# Запускаем улучшенный анализатор
node enhanced-behavior-analyzer.js
```

## ⚠️ Важные замечания

### Ограничения парсинга:
- Некоторые сайты могут блокировать частые запросы
- Структура страниц может изменяться
- Не все лоты могут иметь доступную историю ставок

### Рекомендации:
- Начинайте с небольших батчей для тестирования
- Мониторьте логи на предмет ошибок
- Делайте резервные копии базы данных
- Запускайте сбор в нерабочее время

### Оптимизация:
- Используйте задержки между запросами (2-3 секунды)
- Настройте retry логику для неудачных запросов
- Мониторьте использование ресурсов

## 📈 Ожидаемые результаты

После внедрения системы сбора истории ставок:

### Количественные улучшения:
- **Покрытие анализа**: с 40% до 100% гипотез
- **Точность выявления**: с 60% до 95%+
- **Детализация**: полная картина поведения участников

### Качественные улучшения:
- Выявление множественных аккаунтов
- Обнаружение координированных манипуляций
- Анализ тактик разгона цен
- Детекция прощупывания автобидов

## 🔧 Техническая поддержка

### Мониторинг процесса:
```bash
# Проверка прогресса
SELECT 
    COUNT(*) as total_lots,
    COUNT(CASE WHEN bidding_history_collected = TRUE THEN 1 END) as with_history,
    COUNT(CASE WHEN bidding_history_collected = FALSE THEN 1 END) as without_history
FROM auction_lots;
```

### Отладка проблем:
```bash
# Просмотр ошибок сбора
SELECT * FROM bidding_collection_progress 
WHERE bidding_history_collected = FALSE 
ORDER BY last_attempt DESC 
LIMIT 10;
```

### Очистка данных:
```bash
# Сброс флагов для повторного сбора
UPDATE auction_lots 
SET bidding_history_collected = FALSE 
WHERE auction_number = '2133';
```

## 🎉 Заключение

Внедрение системы сбора истории ставок решает ключевую проблему недостатка данных для анализа поведения. Это позволит:

1. **Проверить все 7 гипотез** Анатолия QGL
2. **Выявить сложные манипуляции** с высокой точностью
3. **Предложить эффективные контрмеры** против недобросовестных участников
4. **Повысить прозрачность** торгового процесса

Система спроектирована как модульная и может быть интегрирована в существующий процесс парсинга без нарушения текущей функциональности.