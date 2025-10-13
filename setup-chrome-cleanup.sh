#!/bin/bash

# Скрипт для настройки автоматической очистки файлов метрик Chrome

echo "🔧 Настраиваем автоматическую очистку файлов метрик Chrome..."

# Делаем скрипт исполняемым
chmod +x cleanup-chrome-metrics.js

# Создаем cron job для очистки каждые 30 минут
echo "*/30 * * * * cd /root/wolmar-parser && node cleanup-chrome-metrics.js >> /var/log/chrome-cleanup.log 2>&1" | crontab -

# Создаем cron job для очистки при перезагрузке системы
echo "@reboot cd /root/wolmar-parser && node cleanup-chrome-metrics.js >> /var/log/chrome-cleanup.log 2>&1" | crontab -

echo "✅ Настройка завершена!"
echo "📋 Cron jobs созданы:"
echo "   - Очистка каждые 30 минут"
echo "   - Очистка при перезагрузке"
echo "📝 Логи сохраняются в /var/log/chrome-cleanup.log"

# Показываем текущие cron jobs
echo "🔍 Текущие cron jobs:"
crontab -l

# Запускаем очистку сразу
echo "🧹 Запускаем очистку сейчас..."
node cleanup-chrome-metrics.js
