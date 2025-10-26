const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.ANALYTICS_PORT || 3002;

// Настройка CORS
app.use(cors());
app.use(express.json());

// Статические файлы
app.use(express.static('public'));

// Подключение к базе данных (Supabase)
const pool = new Pool({
    user: 'postgres.xkwgspqwebfeteoblayu',
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Gopapopa326+',
    port: 6543,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    allowExitOnIdle: true
});

// Проверка подключения к БД
pool.on('connect', () => {
    console.log('🔗 Analytics Service: Подключение к базе данных установлено');
});

pool.on('error', (err) => {
    console.error('❌ Analytics Service: Ошибка подключения к БД:', err);
});

// API для получения статистики дашборда
app.get('/api/analytics/dashboard-stats', async (req, res) => {
    try {
        const queries = {
            totalBids: 'SELECT COUNT(*) as count FROM lot_bids',
            totalLots: 'SELECT COUNT(*) as count FROM auction_lots',
            totalBidders: 'SELECT COUNT(DISTINCT bidder_login) as count FROM lot_bids',
            manualBids: 'SELECT COUNT(*) as count FROM lot_bids WHERE is_auto_bid = false',
            autobids: 'SELECT COUNT(*) as count FROM lot_bids WHERE is_auto_bid = true'
        };
        
        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const result = await pool.query(query);
            results[key] = parseInt(result.rows[0].count);
        }
        
        results.manualBidPercentage = results.totalBids > 0 
            ? Math.round((results.manualBids / results.totalBids) * 100) 
            : 0;
        
        res.json({
            success: true,
            data: results
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения статистики дашборда:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения статистики дашборда',
            details: error.message 
        });
    }
});

// API для анализа быстрых ручных ставок
app.get('/api/analytics/fast-manual-bids', async (req, res) => {
    try {
        const query = `
            WITH bid_intervals AS (
                SELECT 
                    lot_id,
                    auction_number,
                    lot_number,
                    bidder_login,
                    bid_amount,
                    bid_timestamp,
                    is_auto_bid,
                    LAG(bid_timestamp) OVER (PARTITION BY lot_id ORDER BY bid_timestamp) as prev_bid_timestamp,
                    EXTRACT(EPOCH FROM (bid_timestamp - LAG(bid_timestamp) OVER (PARTITION BY lot_id ORDER BY bid_timestamp))) as seconds_between_bids
                FROM lot_bids 
                WHERE lot_id IN (
                    SELECT lot_id 
                    FROM lot_bids 
                    GROUP BY lot_id 
                    HAVING COUNT(*) > 5
                )
            )
            SELECT 
                lot_id,
                auction_number,
                lot_number,
                bidder_login,
                bid_amount,
                bid_timestamp,
                is_auto_bid,
                seconds_between_bids,
                CASE 
                    WHEN is_auto_bid = false AND seconds_between_bids < 1 THEN 'КРИТИЧЕСКИ ПОДОЗРИТЕЛЬНО: ручная ставка < 1 сек'
                    WHEN is_auto_bid = false AND seconds_between_bids < 5 THEN 'ПОДОЗРИТЕЛЬНО: ручная ставка < 5 сек'
                    WHEN is_auto_bid = false AND seconds_between_bids < 30 THEN 'ВНИМАНИЕ: быстрая ручная ставка'
                END as suspicious_level
            FROM bid_intervals
            WHERE is_auto_bid = false 
              AND seconds_between_bids < 30
            ORDER BY seconds_between_bids ASC, lot_id, bid_timestamp
            LIMIT 100;
        `;
        
        const { rows } = await pool.query(query);
        
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка анализа быстрых ручных ставок:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка анализа быстрых ручных ставок',
            details: error.message 
        });
    }
});

// Страница аналитики
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Analytics Service запущен на порту ${PORT}`);
    console.log(`📊 Аналитика доступна по адресу: http://localhost:${PORT}/analytics`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Analytics Service: Получен сигнал завершения, закрываем соединения...');
    await pool.end();
    process.exit(0);
});

module.exports = app;
