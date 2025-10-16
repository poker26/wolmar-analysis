#!/bin/bash

echo "🚀 Запускаем улучшенный тест входа в Wolmar..."
echo "📅 Время: $(date)"
echo ""

# Переходим в директорию проекта
cd /var/www/wolmar-parser

# Запускаем улучшенный скрипт
node wolmar-login-enhanced.js

echo ""
echo "📸 Проверяем созданные файлы:"
ls -la wolmar-*-enhanced.* 2>/dev/null || echo "Файлы не найдены"

echo ""
echo "🔍 Тест завершен!"
