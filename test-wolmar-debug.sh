#!/bin/bash

echo "🔍 Запускаем отладочный анализ страницы Wolmar..."
echo "📅 Время: $(date)"
echo ""

# Переходим в директорию проекта
cd /var/www/wolmar-parser

# Запускаем отладочный скрипт
node wolmar-login-debug.js

echo ""
echo "📸 Проверяем созданные файлы:"
ls -la wolmar-*.png wolmar-*.html 2>/dev/null || echo "Файлы не найдены"

echo ""
echo "🔍 Анализ завершен!"
