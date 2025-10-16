#!/bin/bash

echo "🔍 Проверяем статус истории ставок..."
echo "📅 Время: $(date)"
echo ""

cd /var/www/wolmar-parser

echo "🚀 Запускаем проверку данных в lot_bids..."
node check-lot-bids-data.js

echo ""
echo "🔍 Проверяем, запущен ли процесс обновления ставок..."
echo ""

# Проверяем, есть ли запущенные процессы обновления ставок
ps aux | grep "update-watchlist-bids" | grep -v grep

echo ""
echo "📊 Статус PM2 процессов:"
pm2 list

echo ""
echo "🎉 Проверка завершена!"
