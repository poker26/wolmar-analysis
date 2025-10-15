#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ PM2 WATCH"
echo "=================================="

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
echo "4️⃣ Запускаем процессы заново с новой конфигурацией:"
pm2 start ecosystem.config.js

echo ""
echo "5️⃣ Проверяем статус после перезапуска:"
pm2 status

echo ""
echo "6️⃣ Проверяем конфигурацию PM2:"
pm2 show wolmar-main

echo ""
echo "✅ Исправление завершено!"
echo "Теперь PM2 не должен перезапускать сервер при изменении логов category-parser"
