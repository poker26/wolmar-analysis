# 🎯 Руководство по тестированию Wolmar Category Parser

## 📋 Обзор

Новый парсер `WolmarCategoryParser` предназначен для парсинга лотов по категориям Wolmar вместо парсинга по аукционам. Это позволяет:

- **Структурированный парсинг** - лоты сразу получают категории
- **Полнота данных** - покрытие всех категорий Wolmar
- **Автоматическая классификация** - применение `LotClassifier` для определения категорий

## 🏗️ Архитектура

### Основные компоненты:

1. **`wolmar-category-parser.js`** - основной парсер
2. **`add-category-parser-fields.js`** - добавление полей в БД
3. **`test-category-parser.js`** - тестовый скрипт
4. **`run-category-parser.js`** - скрипт для полного запуска

### Новые поля в БД:

```sql
ALTER TABLE auction_lots ADD COLUMN source_category VARCHAR(100);
ALTER TABLE auction_lots ADD COLUMN parsing_method VARCHAR(50) DEFAULT 'auction_parser';
```

## 🚀 Инструкции по тестированию на сервере

### 1. Подготовка сервера

```bash
# Переходим в директорию проекта
cd /path/to/wolmar-parser

# Обновляем код с GitHub
git pull origin main

# Устанавливаем зависимости (если нужно)
npm install
```

### 2. Добавление полей в базу данных

```bash
# Добавляем необходимые поля в таблицу auction_lots
node add-category-parser-fields.js
```

**Ожидаемый результат:**
```
✅ Подключение к базе данных установлено
🔧 Добавляем поле source_category...
✅ Поле source_category добавлено
🔧 Добавляем поле parsing_method...
✅ Поле parsing_method добавлено
🔧 Создаем индекс для source_category...
✅ Индекс для source_category создан
🔧 Создаем индекс для parsing_method...
✅ Индекс для parsing_method создан

🎉 Все поля для парсера по категориям успешно добавлены!
```

### 3. Тестовый запуск

```bash
# Запуск в тестовом режиме (2 категории, по 5 лотов)
node test-category-parser.js
```

**Или с параметрами:**

```bash
# Тестовый режим через run-category-parser.js
node run-category-parser.js --test

# Ограниченный запуск
node run-category-parser.js --max-categories=3 --max-lots=10 --delay=1000
```

### 4. Полный запуск

```bash
# Запуск всех категорий (осторожно!)
node run-category-parser.js

# С ограничениями
node run-category-parser.js --max-categories=10 --max-lots=50
```

## 📊 Мониторинг процесса

### Логи парсера:

Парсер выводит подробную информацию:

```
🚀 Начинаем парсинг всех категорий Wolmar...
Настройки: maxCategories=2, maxLotsPerCategory=5, testMode=true

🔍 Обнаружение категорий на Wolmar...
✅ Найдено 15 уникальных категорий
   1. Монеты (parametric) - https://wolmar.ru/?category=1
   2. Банкноты (parametric) - https://wolmar.ru/?category=2
   ...

🎯 [1/2] Обрабатываем категорию: Монеты
🔍 Собираем ссылки на лоты в категории: https://wolmar.ru/?category=1
   📊 Найдено лотов: 1250
   📄 Страниц: 25
   📄 Обрабатываем страницу 1/3: https://wolmar.ru/?category=1
   ✓ Найдено ссылок на странице: 50 (всего: 50)
   ...

[1/5] Парсинг: https://wolmar.ru/auction/1234/lot/567
   ✅ Лот 567: 1 рубль 1898 года. Серебро...
   💰 15000 руб. | 👤 collector123 | 🏷️ coin
```

### Статистика:

```
📊 Статистика по категории "Монеты":
   ✅ Обработано: 5
   ⏭️ Пропущено: 0
   ❌ Ошибок: 0

🎉 Парсинг всех категорий завершен!
📊 Общая статистика:
   ✅ Обработано лотов: 10
   ❌ Ошибок: 0
   ⏭️ Пропущено: 0
```

## 🔍 Проверка результатов

### 1. Проверка в базе данных:

```sql
-- Проверяем новые поля
SELECT 
    lot_number,
    source_category,
    parsing_method,
    category,
    coin_description
FROM auction_lots 
WHERE parsing_method = 'category_parser'
LIMIT 10;

-- Статистика по категориям
SELECT 
    source_category,
    COUNT(*) as count
FROM auction_lots 
WHERE parsing_method = 'category_parser'
GROUP BY source_category
ORDER BY count DESC;
```

### 2. Проверка классификации:

```sql
-- Проверяем автоматическую классификацию
SELECT 
    source_category,
    category,
    COUNT(*) as count
FROM auction_lots 
WHERE parsing_method = 'category_parser'
GROUP BY source_category, category
ORDER BY source_category, count DESC;
```

## ⚠️ Важные замечания

### Безопасность:

1. **Тестовый режим** - всегда начинайте с `--test`
2. **Ограничения** - используйте `--max-categories` и `--max-lots`
3. **Задержки** - не уменьшайте `--delay` ниже 800ms
4. **Мониторинг** - следите за логами и ошибками

### Производительность:

1. **Память** - парсер может потреблять много памяти при больших объемах
2. **Сеть** - много запросов к Wolmar, соблюдайте задержки
3. **База данных** - индексы созданы, но большие вставки могут быть медленными

### Обработка ошибок:

1. **Detached frame** - автоматическое пересоздание страницы
2. **Соединение с БД** - автоматическое переподключение
3. **Таймауты** - увеличение задержек при проблемах

## 🛠️ Отладка

### Частые проблемы:

1. **"parser.parseAllCategories is not a function"**
   - Проверьте, что `wolmar-parser5.js` существует
   - Убедитесь, что `lot-classifier.js` доступен

2. **"Cannot find module './lot-classifier'"**
   - Проверьте наличие файла `lot-classifier.js`
   - Убедитесь в правильности путей

3. **"Connection terminated"**
   - Проблемы с Supabase
   - Проверьте `config.js` и подключение

4. **"Failed to launch browser"**
   - Проблемы с Puppeteer
   - Проверьте `puppeteer-utils.js`

### Логи для отладки:

```bash
# Запуск с подробными логами
DEBUG=* node test-category-parser.js

# Проверка конфигурации
node -e "console.log(require('./config'))"
```

## 📈 Следующие шаги

После успешного тестирования:

1. **Интеграция в основной процесс** - добавление в `server.js`
2. **UI для управления** - кнопки в админ-панели
3. **Планировщик** - автоматический запуск по расписанию
4. **Мониторинг** - дашборд для отслеживания прогресса

## 🎯 Ожидаемые результаты

После успешного тестирования вы должны увидеть:

- ✅ Новые поля в таблице `auction_lots`
- ✅ Лоты с `parsing_method = 'category_parser'`
- ✅ Заполненное поле `source_category`
- ✅ Автоматически определенные `category` через классификатор
- ✅ Статистику по обработанным категориям

**Готово к тестированию на сервере!** 🚀
