#!/bin/bash

echo "🔍 Проверяем статус истории ставок для избранного..."
echo "📅 Время: $(date)"
echo ""

cd /var/www/wolmar-parser

echo "🚀 Запускаем проверку статуса..."
node check-watchlist-bids-status.js

echo ""
echo "🔍 Проверяем, есть ли запущенные процессы обновления ставок..."
echo ""

# Проверяем, есть ли запущенные процессы обновления ставок
ps aux | grep "update-watchlist-bids" | grep -v grep

echo ""
echo "📊 Статус PM2 процессов:"
pm2 list

echo ""
echo "🎉 Проверка завершена!"
