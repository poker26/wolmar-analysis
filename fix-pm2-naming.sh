#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ НАЗВАНИЙ PM2 ПРОЦЕССОВ"
echo "====================================="

echo ""
echo "1️⃣ Останавливаем все процессы PM2:"
pm2 stop all

echo ""
echo "2️⃣ Удаляем все процессы из PM2:"
pm2 delete all

echo ""
echo "3️⃣ Проверяем, что процессы удалены:"
pm2 status

echo ""
echo "4️⃣ Запускаем процессы с правильными названиями:"
pm2 start ecosystem.config.js

echo ""
echo "5️⃣ Проверяем статус после перезапуска:"
pm2 status

echo ""
echo "✅ Теперь у нас:"
echo "   - wolmar-server (порт 3001) - основной сервер"
echo "   - wolmar-catalog (порт 3000) - каталог"
echo ""
echo "✅ Исправление завершено!"
