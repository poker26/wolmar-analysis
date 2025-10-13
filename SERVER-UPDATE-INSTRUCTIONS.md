# 🔄 Инструкции по обновлению на сервере

## Исправление ошибки `this.baseParser.initialize is not a function`

### Проблема:
Парсер по категориям падал с ошибкой, потому что метод в `wolmar-parser5.js` называется `init()`, а не `initialize()`.

### Решение:
Исправление уже отправлено на GitHub. Выполните на сервере:

```bash
# Обновляем код
git pull origin main

# Проверяем, что исправление применилось
git log --oneline -3
```

Должно показать:
```
cda4edd Fix method name: initialize -> init in WolmarCategoryParser
0ba8435 Add comprehensive testing guide for Wolmar Category Parser
23e5aa6 Add Wolmar Category Parser - new parser for category-based lot parsing
```

### Теперь можно тестировать:

```bash
# Добавляем поля в БД (если еще не делали)
node add-category-parser-fields.js

# Запускаем тест
node test-category-parser.js
```

### Ожидаемый результат:
```
🧪 Запуск тестирования Wolmar Category Parser...

📋 Тестовые настройки:
   - Максимум категорий: 2
   - Максимум лотов на категорию: 5
   - Пропускать существующие: true
   - Задержка между лотами: 1500ms
   - Тестовый режим: true

🚀 Начинаем парсинг всех категорий Wolmar...
Настройки: maxCategories=2, maxLotsPerCategory=5, testMode=true

🔍 Обнаружение категорий на Wolmar...
✅ Найдено X уникальных категорий
   1. Монеты (parametric) - https://wolmar.ru/?category=1
   2. Банкноты (parametric) - https://wolmar.ru/?category=2
   ...

🎯 [1/2] Обрабатываем категорию: Монеты
🔍 Собираем ссылки на лоты в категории: https://wolmar.ru/?category=1
   📊 Найдено лотов: XXX
   📄 Страниц: XX
   ...
```

**Исправление готово к тестированию!** ✅
