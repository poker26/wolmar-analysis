#!/bin/bash

echo "🧪 Тестируем вход на сайт Wolmar..."
echo "👤 Пользователь: hippo26"
echo "🔑 Пароль: Gopapopa326"
echo ""

# Проверяем, что мы в правильной директории
if [ ! -f "wolmar-login-test.js" ]; then
    echo "❌ Файл wolmar-login-test.js не найден!"
    echo "Убедитесь, что вы находитесь в правильной директории"
    exit 1
fi

# Проверяем, что Node.js установлен
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

# Проверяем, что puppeteer установлен
if [ ! -d "node_modules/puppeteer" ]; then
    echo "📦 Устанавливаем puppeteer..."
    npm install puppeteer
fi

echo "🚀 Запускаем тест входа..."
echo ""

# Запускаем скрипт
node wolmar-login-test.js

echo ""
echo "✅ Тест завершен!"
echo "📸 Проверьте скриншоты для анализа результатов"
