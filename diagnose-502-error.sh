#!/bin/bash

echo "🔍 ДИАГНОСТИКА 502 BAD GATEWAY"
echo "================================"

echo ""
echo "1️⃣ Проверяем статус PM2 процессов:"
pm2 status

echo ""
echo "2️⃣ Проверяем логи PM2:"
echo "--- Последние 20 строк логов wolmar-server ---"
pm2 logs wolmar-server --lines 20

echo ""
echo "3️⃣ Проверяем, слушает ли Node.js на порту 3001:"
netstat -tlnp | grep :3001

echo ""
echo "4️⃣ Проверяем статус Nginx:"
systemctl status nginx --no-pager -l

echo ""
echo "5️⃣ Проверяем конфигурацию Nginx:"
nginx -t

echo ""
echo "6️⃣ Проверяем логи Nginx:"
echo "--- Последние 20 строк error.log ---"
tail -20 /var/log/nginx/error.log

echo ""
echo "7️⃣ Проверяем доступность Node.js напрямую:"
curl -I http://localhost:3001/ || echo "❌ Node.js недоступен на localhost:3001"

echo ""
echo "8️⃣ Проверяем доступность через Nginx:"
curl -I http://localhost/ || echo "❌ Nginx недоступен"

echo ""
echo "9️⃣ Проверяем использование памяти и CPU:"
free -h
echo "CPU load:"
uptime

echo ""
echo "🔟 Проверяем активные соединения:"
ss -tuln | grep -E ':(80|443|3001)'

echo ""
echo "✅ Диагностика завершена"
