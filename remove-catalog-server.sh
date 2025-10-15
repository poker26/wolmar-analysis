#!/bin/bash

echo "🗑️ УДАЛЕНИЕ CATALOG-SERVER (АРТЕФАКТ СТАРОЙ АРХИТЕКТУРЫ)"
echo "========================================================"

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
echo "4️⃣ Запускаем только основной сервер с новой конфигурацией:"
pm2 start ecosystem.config.js

echo ""
echo "5️⃣ Проверяем статус после перезапуска:"
pm2 status

echo ""
echo "6️⃣ Проверяем, что каталог доступен через основной сервер:"
echo "Каталог должен быть доступен по адресу: https://coins.begemot26.ru/catalog"

echo ""
echo "✅ Удаление catalog-server завершено!"
echo "Теперь работает только один сервер: wolmar-server (порт 3001)"
echo "Каталог доступен через основной сервер: /catalog"
