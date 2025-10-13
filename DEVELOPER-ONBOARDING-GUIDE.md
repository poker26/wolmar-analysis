# 🚀 Гайд для быстрого ознакомления с проектом Wolmar

## 📋 Обзор проекта

**Wolmar Auction Parser** - это комплексная система для парсинга, анализа и управления данными аукционов коллекционных предметов (монет, медалей, значков) с сайтов Wolmar.ru и Numismat.ru.

### 🎯 Основные цели проекта:
- **Парсинг аукционов** - автоматический сбор данных о лотах и торгах
- **Анализ поведения** - выявление манипуляций и подозрительной активности
- **Веб-интерфейс** - удобный просмотр и анализ данных
- **Каталог коллекций** - управление личными коллекциями
- **Прогнозирование цен** - оценка стоимости монет

---

## 🏗️ Архитектура проекта

### **Основные компоненты:**

```
wolmar-parser/
├── 🌐 Веб-интерфейс (public/, catalog-public/)
├── 🔧 Сервер API (server.js)
├── 🤖 Парсеры аукционов (wolmar-parser*.js, numismat-parser.js)
├── 📊 Анализаторы данных (auction-behavior-analyzer*.js)
├── 🗄️ База данных PostgreSQL
└── ⚙️ Конфигурация и утилиты
```

---

## 🗄️ Структура базы данных

### **Основные таблицы:**

#### **`auction_lots`** - Основная таблица лотов
```sql
CREATE TABLE auction_lots (
    id SERIAL PRIMARY KEY,
    lot_number VARCHAR(50),              -- Номер лота
    auction_number VARCHAR(50),          -- Номер аукциона
    coin_description TEXT,               -- Описание монеты
    avers_image_url TEXT,                -- URL изображения аверса
    revers_image_url TEXT,               -- URL изображения реверса
    winner_login VARCHAR(100),           -- Логин победителя
    winning_bid DECIMAL(12, 2),          -- Выигрышная ставка
    auction_end_date TIMESTAMP,          -- Дата окончания аукциона
    source_url TEXT,                     -- URL источника
    bids_count INTEGER,                  -- Количество ставок
    lot_status VARCHAR(20),              -- Статус лота
    year INTEGER,                        -- Год выпуска
    letters VARCHAR(10),                 -- Буквы на монете
    metal VARCHAR(10),                   -- Металл (Ag, Au, Cu)
    condition VARCHAR(20),               -- Состояние монеты
    bidding_history_collected BOOLEAN,   -- Собрана ли история ставок
    suspicious_activity_score DECIMAL(5,2), -- Оценка подозрительности
    manipulation_indicators JSONB,       -- Индикаторы манипуляций
    UNIQUE(lot_number, auction_number)
);
```

#### **`auction_lot_urls`** - URL лотов для парсинга
```sql
CREATE TABLE auction_lot_urls (
    id SERIAL PRIMARY KEY,
    auction_number VARCHAR(50),
    lot_url TEXT NOT NULL,
    lot_number VARCHAR(50),
    page_number INTEGER,
    url_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auction_number, lot_url)
);
```

#### **`auction_bids`** - История ставок
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

#### **`coin_catalog`** - Каталог монет
```sql
CREATE TABLE coin_catalog (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES auction_lots(id),
    auction_number INTEGER,
    lot_number VARCHAR(50),
    denomination VARCHAR(100),           -- Номинал
    coin_name VARCHAR(500),              -- Название монеты
    year INTEGER,                        -- Год выпуска
    metal VARCHAR(20),                   -- Металл
    rarity VARCHAR(10),                  -- Редкость (R, RR, RRR)
    mint VARCHAR(200),                   -- Монетный двор
    mintage INTEGER,                     -- Тираж
    condition VARCHAR(100),              -- Состояние
    bitkin_info TEXT,                    -- Информация из каталога Биткина
    uzdenikov_info TEXT,                 -- Информация из каталога Узденикова
    avers_image_path VARCHAR(500),       -- Путь к изображению аверса
    revers_image_path VARCHAR(500),      -- Путь к изображению реверса
    original_description TEXT,           -- Оригинальное описание
    parsed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **`metals_prices`** - Цены на драгоценные металлы
```sql
CREATE TABLE metals_prices (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    usd_rate DECIMAL(10,4),
    gold_price DECIMAL(10,4),            -- цена золота за грамм в рублях
    silver_price DECIMAL(10,4),          -- цена серебра за грамм в рублях
    platinum_price DECIMAL(10,4),        -- цена платины за грамм в рублях
    palladium_price DECIMAL(10,4),       -- цена палладия за грамм в рублях
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **`collection_users`** - Пользователи коллекций
```sql
CREATE TABLE collection_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **`user_collections`** - Коллекции пользователей
```sql
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES collection_users(id),
    coin_id INTEGER NOT NULL,
    user_condition VARCHAR(10),
    purchase_price DECIMAL(12,2),
    purchase_date DATE,
    notes TEXT,
    predicted_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 Веб-интерфейс

### **Основные страницы:**

#### **1. Главная страница** (`public/index.html`)
**URL:** `http://localhost:3000/`

**Функциональность:**
- **Вкладка "Аукционы"** - список всех аукционов с статистикой
- **Вкладка "Лоты"** - просмотр лотов выбранного аукциона
- **Вкладка "Победители"** - анализ активности победителей
- **Вкладка "Поиск лотов"** - глобальный поиск по всем лотам
- **Вкладка "Текущий аукцион"** - мониторинг активного аукциона
- **Вкладка "Избранное"** - управление списком отслеживаемых лотов

**Ключевые кнопки:**
- `🔄 Обновить` - обновление данных
- `📊 Экспорт CSV` - экспорт данных в CSV
- `🔍 Поиск` - поиск по описанию лотов
- `⚙️ Фильтры` - фильтрация по металлу, состоянию, цене

#### **2. Каталог коллекций** (`catalog-public/index.html`)
**URL:** `http://localhost:3000/catalog`

**Функциональность:**
- **Вкладка "Каталог"** - просмотр каталога монет
- **Вкладка "Моя коллекция"** - управление личной коллекцией
- **Поиск по каталогу** - поиск монет по различным критериям
- **Фильтрация** - по странам, металлам, редкости, состоянию
- **Детальный просмотр** - информация о монете с изображениями

**Ключевые кнопки:**
- `🔍 Поиск` - поиск по каталогу
- `➕ Добавить в коллекцию` - добавление монеты в коллекцию
- `📊 Статистика` - статистика коллекции
- `💰 Пересчитать цены` - обновление прогнозных цен

#### **3. Административная панель** (`public/admin.html`)
**URL:** `http://localhost:3000/admin`

**Функциональность:**
- **Управление парсерами** - запуск/остановка парсеров
- **Мониторинг системы** - статус процессов и логов
- **Управление каталогом** - запуск парсера каталога
- **Восстановление после сбоев** - автоматическое восстановление
- **Планировщик задач** - настройка автоматических задач

**Ключевые кнопки:**
- `▶️ Запустить парсер` - запуск основного парсера
- `⏹️ Остановить парсер` - остановка парсера
- `🔄 Обновить ставки` - обновление текущих ставок
- `📊 Статистика` - просмотр статистики системы

#### **4. Мониторинг** (`public/monitor.html`)
**URL:** `http://localhost:3000/monitor`

**Функциональность:**
- **Мониторинг процессов** - статус всех запущенных процессов
- **Логи в реальном времени** - просмотр логов парсеров
- **Статистика производительности** - метрики системы
- **Алерты** - уведомления о проблемах

---

## 🔧 API Endpoints

### **Основные API:**

#### **Аукционы:**
- `GET /api/auctions` - Список всех аукционов
- `GET /api/auctions/:auctionNumber/lots` - Лоты конкретного аукциона
- `GET /api/auctions/:auctionNumber/stats` - Статистика аукциона
- `GET /api/current-auction` - Информация о текущем аукционе

#### **Лоты:**
- `GET /api/lots/:id` - Детальная информация о лоте
- `GET /api/top-lots` - Топ лотов по цене
- `GET /api/search-lots` - Поиск лотов с фильтрами
- `GET /api/lot-details/:lotId` - Подробная информация о лоте

#### **Победители:**
- `GET /api/winners` - Список победителей
- `GET /api/winners/:login` - Статистика конкретного победителя
- `GET /api/ratings/:login` - Рейтинг пользователя

#### **Каталог:**
- `GET /api/catalog/coins` - Список монет в каталоге
- `GET /api/catalog/coins/:id` - Детали монеты
- `GET /api/catalog/filters` - Доступные фильтры
- `GET /api/catalog/stats` - Статистика каталога

#### **Коллекции:**
- `POST /api/auth/login` - Авторизация пользователя
- `POST /api/auth/register` - Регистрация пользователя
- `GET /api/collection` - Получить коллекцию пользователя
- `POST /api/collection/add` - Добавить монету в коллекцию
- `DELETE /api/collection/remove` - Удалить монету из коллекции

#### **Администрирование:**
- `POST /api/admin/start-main-parser` - Запуск основного парсера
- `POST /api/admin/stop-main-parser` - Остановка основного парсера
- `POST /api/admin/start-update-parser` - Запуск парсера обновлений
- `GET /api/admin/status` - Статус системы

#### **Металлы и цены:**
- `GET /api/metals-prices` - Цены на драгоценные металлы
- `GET /api/numismatic-premium/:lotId` - Нумизматическая премия

---

## 🤖 Парсеры аукционов

### **Основные парсеры:**

#### **1. Wolmar Parser** (`wolmar-parser5.js`)
**Назначение:** Парсинг аукционов с сайта Wolmar.ru

**Синтаксис команд:**
```bash
# Полный парсинг аукциона
node wolmar-parser5.js main <номер_аукциона>

# Возобновление с сохраненного прогресса
node wolmar-parser5.js resume <номер_аукциона>

# Запуск с определенного номера лота
node wolmar-parser5.js lot <номер_аукциона> <номер_лота>

# Запуск с определенного индекса
node wolmar-parser5.js index <номер_аукциона> <номер_индекса>
```

**Примеры:**
```bash
node wolmar-parser5.js main 2133
node wolmar-parser5.js resume 2133
node wolmar-parser5.js lot 2133 7512932
```

#### **2. Numismat Parser** (`numismat-parser.js`)
**Назначение:** Парсинг аукционов с сайта Numismat.ru

**Использование:**
```bash
node numismat-parser.js <номер_аукциона>
```

#### **3. Update Parser** (`update-current-auction.js`)
**Назначение:** Обновление ставок для текущего аукциона

**Использование:**
```bash
# Обновление ставок для аукциона
node update-current-auction.js <внутренний_номер_БД> [стартовый_индекс]

# Автоматический поиск текущего аукциона
node update-current-auction.js
```

#### **4. Catalog Parser** (`catalog-parser.js`)
**Назначение:** Парсинг каталога монет

**Использование:**
```bash
node catalog-parser.js
```

### **Парсеры с историей ставок:**

#### **5. Enhanced Parser** (`enhanced-parser-with-bidding.js`)
**Назначение:** Парсинг с автоматическим сбором истории ставок

#### **6. Bidding History Tracker** (`bidding-history-tracker.js`)
**Назначение:** Сбор истории ставок для существующих лотов

**Использование:**
```bash
# Просмотр статистики
node run-bidding-history-collection.js --stats

# Сбор для существующих лотов
node run-bidding-history-collection.js --existing --batch=50 --max=1000

# Парсинг новых лотов
node run-bidding-history-collection.js --new --auction=2134
```

---

## 📊 Анализаторы данных

### **Основные анализаторы:**

#### **1. Auction Behavior Analyzer** (`auction-behavior-analyzer-complete.js`)
**Назначение:** Анализ поведения участников аукционов

**Функциональность:**
- Выявление круговых покупок
- Анализ доминирующих победителей
- Обнаружение концентрации побед
- Анализ множественных аккаунтов
- Выявление тактик "приманки"
- Обнаружение синхронных ставок
- Анализ прощупывания автобидов

#### **2. Price Predictor** (`price-predictor.js`)
**Назначение:** Прогнозирование цен на монеты

**Функциональность:**
- Расчет нумизматической премии
- Учет цен на драгоценные металлы
- Анализ исторических данных
- Генерация прогнозов для коллекций

#### **3. Winner Ratings Service** (`winner-ratings-service.js`)
**Назначение:** Рейтинговая система для участников

**Функциональность:**
- Расчет рейтингов победителей
- Анализ активности участников
- Выявление подозрительных паттернов

---

## ⚙️ Конфигурация

### **Основной файл конфигурации** (`config.js`)

```javascript
module.exports = {
    // Конфигурация базы данных PostgreSQL
    dbConfig: {
        user: 'your_username',
        host: 'your_host',
        database: 'your_database',
        password: 'your_password',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    },
    
    // Настройки браузера Puppeteer
    browserConfig: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    },
    
    // Настройки парсинга
    parserConfig: {
        delayBetweenLots: 800,        // Задержка между лотами (мс)
        batchSize: 50,                // Размер пакета для статистики
        maxLots: null,                // Максимальное количество лотов
        skipExisting: true,           // Пропускать существующие лоты
        testMode: false,              // Тестовый режим
        maxRetries: 3,                // Максимальное количество попыток
        retryDelay: 5000              // Задержка между попытками (мс)
    }
};
```

### **Production конфигурация** (`config.production.js`)
Используется автоматически в production окружении.

---

## 🚀 Запуск и развертывание

### **Локальная разработка:**

```bash
# Установка зависимостей
npm install

# Настройка конфигурации
cp config.example.js config.js
# Отредактируйте config.js под ваши настройки

# Запуск сервера
npm start

# Запуск в режиме разработки
npm run dev
```

### **Production развертывание:**

```bash
# Использование PM2 для управления процессами
pm2 start ecosystem.config.js

# Автозапуск при перезагрузке
pm2 save
pm2 startup

# Мониторинг
pm2 status
pm2 logs
```

### **Docker развертывание:**
```bash
# Сборка образа
docker build -t wolmar-parser .

# Запуск контейнера
docker run -p 3000:3000 wolmar-parser
```

---

## 🔍 Мониторинг и отладка

### **Логи системы:**
- **Основной сервер:** `logs/server.log`
- **Парсеры:** `logs/parser.log`
- **Ошибки:** `logs/error.log`

### **Мониторинг процессов:**
```bash
# Статус PM2 процессов
pm2 status

# Логи в реальном времени
pm2 logs

# Перезапуск процессов
pm2 restart all
```

### **Проверка базы данных:**
```bash
# Проверка структуры таблиц
node check-table-structure.js

# Проверка подключения
node check-db-connection.js
```

### **Отладка парсеров:**
```bash
# Тестовый запуск парсера
node wolmar-parser5.js test 2133

# Проверка конкретного лота
node check-lot-113.js
```

---

## 🛠️ Разработка

### **Структура кода:**

#### **Основные классы:**
- `WolmarAuctionParser` - основной парсер Wolmar
- `NumismatAuctionParser` - парсер Numismat
- `AuctionBehaviorAnalyzer` - анализатор поведения
- `PricePredictor` - прогнозировщик цен
- `CollectionService` - сервис коллекций

#### **Утилиты:**
- `puppeteer-utils.js` - утилиты для работы с Puppeteer
- `auth-service.js` - сервис авторизации
- `metals-price-service.js` - сервис цен на металлы

### **Добавление новой функциональности:**

1. **Создание нового API endpoint:**
```javascript
app.get('/api/new-endpoint', async (req, res) => {
    try {
        // Логика endpoint
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

2. **Добавление новой таблицы:**
```javascript
await client.query(`
    CREATE TABLE IF NOT EXISTS new_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);
```

3. **Создание нового парсера:**
```javascript
class NewParser {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
    }
    
    async init() {
        // Инициализация
    }
    
    async parse() {
        // Логика парсинга
    }
}
```

---

## 📚 Полезные команды

### **Управление парсерами:**
```bash
# Запуск основного парсера
node wolmar-parser5.js main 2133

# Обновление ставок
node update-current-auction.js 968

# Парсинг каталога
node catalog-parser.js

# Сбор истории ставок
node run-bidding-history-collection.js --existing
```

### **Анализ данных:**
```bash
# Анализ поведения
node auction-behavior-analyzer-complete.js

# Генерация прогнозов
node generate-predictions-with-progress.js

# Анализ цен
node price-predictor.js
```

### **Управление системой:**
```bash
# Запуск сервера
npm start

# Остановка всех процессов
pm2 stop all

# Перезапуск системы
pm2 restart all

# Просмотр логов
pm2 logs
```

### **Работа с базой данных:**
```bash
# Проверка структуры
node check-table-structure.js

# Проверка данных
node check-specific-lots.js

# Очистка дубликатов
node clean-duplicates.js
```

---

## 🆘 Решение проблем

### **Частые проблемы:**

#### **1. Ошибки подключения к БД:**
```bash
# Проверка подключения
node check-db-connection.js

# Проверка конфигурации
cat config.js
```

#### **2. Проблемы с парсерами:**
```bash
# Проверка Chrome
node check-chrome.py

# Тестовый запуск
node wolmar-parser5.js test 2133

# Очистка временных файлов
node cleanup-chrome-metrics.js
```

#### **3. Проблемы с производительностью:**
```bash
# Мониторинг процессов
pm2 monit

# Очистка логов
pm2 flush

# Перезапуск с очисткой
pm2 restart all --update-env
```

### **Восстановление после сбоев:**
```bash
# Автоматическое восстановление
node auto-recovery.js

# Восстановление с определенного лота
node wolmar-parser5.js lot 2133 7512932

# Восстановление с определенного индекса
node wolmar-parser5.js index 2133 1000
```

---

## 📖 Дополнительная документация

### **Специализированные гайды:**
- `BIDDING-HISTORY-GUIDE.md` - Руководство по сбору истории ставок
- `DEPLOYMENT-GUIDE.md` - Руководство по развертыванию
- `PARSER-SYNTAX-REFERENCE.md` - Справочник синтаксиса парсеров
- `CATALOG-DEPLOYMENT-GUIDE.md` - Развертывание каталога
- `SERVER-DEPLOYMENT-BIDDING.md` - Развертывание сервера с историей ставок

### **Анализ и отчеты:**
- `AUCTION-ANALYSIS-README.md` - Анализ аукционов
- `COMPLETE-ANALYZER-GUIDE.md` - Полный анализатор
- `ANALYZER-COMPARISON.md` - Сравнение анализаторов

### **Техническая документация:**
- `INTEGRATION-GUIDE.md` - Руководство по интеграции
- `MONITORING-README.md` - Мониторинг системы
- `PM2-README.md` - Управление процессами

---

## 🎯 Быстрый старт для нового разработчика

### **1. Первоначальная настройка:**
```bash
# Клонирование репозитория
git clone https://github.com/poker26/wolmar.git
cd wolmar-parser

# Установка зависимостей
npm install

# Настройка конфигурации
cp config.example.js config.js
# Отредактируйте config.js

# Запуск сервера
npm start
```

### **2. Изучение основных компонентов:**
1. **Откройте** `http://localhost:3000` - главный интерфейс
2. **Изучите** `public/index.html` - структуру веб-интерфейса
3. **Просмотрите** `server.js` - основные API endpoints
4. **Изучите** `wolmar-parser5.js` - основной парсер

### **3. Первые эксперименты:**
```bash
# Тестовый запуск парсера
node wolmar-parser5.js test 2133

# Проверка базы данных
node check-table-structure.js

# Анализ данных
node auction-behavior-analyzer-complete.js
```

### **4. Изучение API:**
```bash
# Список аукционов
curl http://localhost:3000/api/auctions

# Лоты аукциона
curl http://localhost:3000/api/auctions/2133/lots

# Статистика
curl http://localhost:3000/api/statistics
```

---

## 📞 Поддержка

### **При возникновении проблем:**
1. **Проверьте логи:** `pm2 logs`
2. **Проверьте статус:** `pm2 status`
3. **Перезапустите систему:** `pm2 restart all`
4. **Обратитесь к документации** в папке проекта
5. **Создайте issue** в репозитории GitHub

### **Полезные ресурсы:**
- **GitHub репозиторий:** https://github.com/poker26/wolmar
- **Документация API:** встроена в код
- **Логи системы:** `logs/` папка
- **Конфигурация:** `config.js`

---

**🎉 Добро пожаловать в команду разработки проекта Wolmar!**

Этот гайд поможет вам быстро освоиться с проектом. При возникновении вопросов обращайтесь к команде или изучайте существующий код - он хорошо документирован и содержит множество примеров.
