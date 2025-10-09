#!/bin/bash

echo "🔄 Обновляем парсер обновления ставок на сервере..."

# Переходим в директорию проекта
cd /var/www

# Получаем последние изменения из GitHub
echo "📥 Получаем последние изменения из GitHub..."
git pull origin main

# Проверяем, что файл обновился
echo "📋 Проверяем конфигурацию Puppeteer в update-current-auction-fixed.js..."
grep -A 10 "puppeteer.launch" update-current-auction-fixed.js

echo "✅ Обновление завершено!"
echo "🧪 Теперь можно протестировать парсер обновления ставок"
