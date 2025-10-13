/**
 * РАБОЧАЯ версия оптимизированного скрипта для массового обновления состояний лотов
 * 
 * ИСПРАВЛЕНИЯ:
 * 1. Правильное сопоставление внутренних номеров wolmar с номерами аукционов в БД
 * 2. Улучшенное определение пагинации для wolmar.ru
 * 3. Парсинг ВСЕХ страниц аукциона
 * 4. Улучшенная обработка ошибок
 * 
 * Версия: 3.0 (рабочая)
 * Дата: 18.09.2025
 */

const { Client } = require('pg');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const config = require('./config');

class WorkingOptimizedMassUpdater {
    constructor() {
        this.dbConfig = config.dbConfig;
        this.dbClient = new Client(this.dbConfig);
        this.browser = null;
        this.page = null;
        
        // Статистика
        this.stats = {
            processed: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            auctionsProcessed: 0,
            pagesProcessed: 0,
            startTime: null
        };
        
        this.progressFile = 'working_mass_update_progress.json';
        this.loadProgress();
    }

    async init() {
        try {
            await this.dbClient.connect();
            console.log('🔗 Подключение к базе данных установлено');
            
            await this.initBrowser();
            console.log('🌐 Браузер инициализирован');
            
            this.stats.startTime = new Date();
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error.message);
            throw error;
        }
    }

    async initBrowser() {
        try {
            const executablePaths = process.platform === 'win32' 
                ? [
                    process.env.PUPPETEER_EXECUTABLE_PATH,
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                  ].filter(Boolean)
                : [
                    process.env.PUPPETEER_EXECUTABLE_PATH,
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium',
                    '/usr/bin/google-chrome',
                    '/snap/bin/chromium'
                  ].filter(Boolean);
            
            let browser;
            let lastError;
            
            for (const executablePath of executablePaths) {
                try {
                    console.log(`🔍 Пробуем запустить браузер: ${executablePath}`);
                    browser = await puppeteer.launch({
                        executablePath,
                        headless: true,
                        args: [
                            '--no-sandbox', 
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu',
                            '--disable-images',
                            '--disable-javascript',
                            '--user-data-dir=/tmp/chrome-temp-' + Math.random().toString(36).substring(7),
                            '--disable-background-timer-throttling',
                            '--disable-backgrounding-occluded-windows',
                            '--disable-metrics',
                            '--disable-metrics-reporting',
                            '--disable-background-mode',
                            '--disable-renderer-backgrounding',
                            '--disable-backgrounding-occluded-windows',
                            '--disable-logging',
                            '--disable-gpu-logging',
                            '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor',
                            '--disable-renderer-backgrounding'
                        ]
                    });
                    console.log(`✅ Браузер успешно запущен: ${executablePath}`);
                    break;
                } catch (error) {
                    console.log(`❌ Не удалось запустить ${executablePath}: ${error.message}`);
                    lastError = error;
                    continue;
                }
            }
            
            if (!browser) {
                throw new Error(`Не удалось запустить браузер ни с одним из путей: ${executablePaths.join(', ')}. Последняя ошибка: ${lastError.message}`);
            }
            
            this.browser = browser;
            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        } catch (error) {
            console.error('❌ Ошибка инициализации браузера:', error.message);
            throw error;
        }
    }

    loadProgress() {
        try {
            if (fs.existsSync(this.progressFile)) {
                const data = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
                this.stats = { ...this.stats, ...data.stats };
                console.log(`📂 Загружен прогресс: ${this.stats.processed} лотов обработано`);
            }
        } catch (error) {
            console.log('⚠️ Не удалось загрузить прогресс, начинаем с начала');
        }
    }

    saveProgress() {
        try {
            const progressData = {
                stats: this.stats,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
        } catch (error) {
            console.error('❌ Ошибка сохранения прогресса:', error.message);
        }
    }

    printStats() {
        const elapsed = Math.floor((new Date() - this.stats.startTime) / 1000);
        const rate = this.stats.processed > 0 ? (this.stats.processed / elapsed * 60).toFixed(1) : 0;
        
        console.log(`\n📊 Прогресс: ${this.stats.processed} лотов | Обновлено: ${this.stats.updated} | Ошибок: ${this.stats.errors} | Пропущено: ${this.stats.skipped} | Скорость: ${rate} лотов/мин`);
        console.log(`🏆 Аукционов: ${this.stats.auctionsProcessed} | Страниц: ${this.stats.pagesProcessed}`);
    }

    // Функция для извлечения состояния с градацией
    extractConditionWithGrade(conditionText) {
        if (!conditionText) return null;
        // Убираем все пробелы для унификации
        return conditionText.replace(/\s+/g, '');
    }

    // Получаем список аукционов с правильным сопоставлением
    async getAuctionsToProcess() {
        console.log('📊 Получаем список аукционов для обработки (рабочая версия)...');
        
        // Получаем все уникальные внутренние номера wolmar из URL
        const query = `
            SELECT DISTINCT 
                SUBSTRING(source_url FROM '/auction/([^/]+)/') as internal_auction_number,
                auction_number,
                COUNT(*) as lots_count
            FROM auction_lots 
            WHERE source_url IS NOT NULL
            GROUP BY internal_auction_number, auction_number
            ORDER BY auction_number DESC
            LIMIT 50;
        `;
        
        const result = await this.dbClient.query(query);
        console.log(`📋 Найдено ${result.rows.length} аукционов для обработки`);
        
        // Выводим информацию о сопоставлении
        result.rows.forEach(row => {
            console.log(`  Внутренний номер ${row.internal_auction_number} -> Аукцион ${row.auction_number} (${row.lots_count} лотов)`);
        });
        
        return result.rows;
    }

    // Улучшенное определение количества страниц
    async getTotalPages(internalAuctionNumber) {
        const auctionUrl = `https://www.wolmar.ru/auction/${internalAuctionNumber}`;
        
        try {
            await this.page.goto(auctionUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Пробуем разные способы определения пагинации
            const totalPages = await this.page.evaluate(() => {
                // Способ 1: Ищем пагинацию
                const pagination = document.querySelector('.pagination');
                if (pagination) {
                    const pageLinks = pagination.querySelectorAll('a');
                    let maxPage = 1;
                    
                    pageLinks.forEach(link => {
                        const text = link.textContent.trim();
                        const pageNum = parseInt(text);
                        if (!isNaN(pageNum) && pageNum > maxPage) {
                            maxPage = pageNum;
                        }
                    });
                    
                    if (maxPage > 1) return maxPage;
                }
                
                // Способ 2: Ищем ссылки на страницы в тексте
                const pageLinks = document.querySelectorAll('a[href*="page="]');
                let maxPage = 1;
                
                pageLinks.forEach(link => {
                    const href = link.href;
                    const pageMatch = href.match(/page=(\d+)/);
                    if (pageMatch) {
                        const pageNum = parseInt(pageMatch[1]);
                        if (pageNum > maxPage) {
                            maxPage = pageNum;
                        }
                    }
                });
                
                // Способ 3: Если ничего не найдено, пробуем перейти на страницу 2
                if (maxPage === 1) {
                    // Проверяем, есть ли ссылка на страницу 2
                    const page2Link = document.querySelector('a[href*="page=2"]');
                    if (page2Link) {
                        maxPage = 2; // Минимум 2 страницы
                    }
                }
                
                return maxPage;
            });
            
            console.log(`📄 Определено ${totalPages} страниц для парсинга`);
            return totalPages;
            
        } catch (error) {
            console.error(`❌ Ошибка определения страниц для аукциона ${internalAuctionNumber}:`, error.message);
            return 1; // По умолчанию 1 страница
        }
    }

    // Парсим одну страницу аукциона
    async parseAuctionPage(internalAuctionNumber, pageNum = 1) {
        const auctionUrl = pageNum === 1 
            ? `https://www.wolmar.ru/auction/${internalAuctionNumber}`
            : `https://www.wolmar.ru/auction/${internalAuctionNumber}?page=${pageNum}`;
        
        try {
            await this.page.goto(auctionUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Извлекаем данные о лотах с состояниями из таблицы
            const lotsData = await this.page.evaluate(() => {
                const lots = [];
                
                // Ищем таблицы с лотами
                const tables = document.querySelectorAll('table');
                
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td, th');
                        
                        // Проверяем, что это строка с лотом (должно быть 10 ячеек и ссылка на лот)
                        if (cells.length >= 10) {
                            const lotLink = row.querySelector('a[href*="/auction/"]');
                            
                            if (lotLink) {
                                const lotUrl = lotLink.href;
                                const lotNumberMatch = lotUrl.match(/\/auction\/\d+\/(\d+)/);
                                const lotNumber = lotNumberMatch ? lotNumberMatch[1] : null;
                                
                                // Состояние находится в 6-й ячейке (индекс 5)
                                const conditionCell = cells[5];
                                const condition = conditionCell ? conditionCell.textContent.trim() : null;
                                
                                // Дополнительная информация
                                const nameCell = cells[1];
                                const yearCell = cells[2];
                                const lettersCell = cells[3];
                                const metalCell = cells[4];
                                
                                if (lotNumber && condition && condition.match(/^(MS|PF|AU|UNC|XF|VF|VG|F|G|PR|PL|Proof|Gem)/i)) {
                                    lots.push({
                                        lotNumber: lotNumber,
                                        lotUrl: lotUrl,
                                        condition: condition,
                                        name: nameCell ? nameCell.textContent.trim() : '',
                                        year: yearCell ? yearCell.textContent.trim() : '',
                                        letters: lettersCell ? lettersCell.textContent.trim() : '',
                                        metal: metalCell ? metalCell.textContent.trim() : ''
                                    });
                                }
                            }
                        }
                    });
                });
                
                return lots;
            });
            
            return lotsData;
            
        } catch (error) {
            console.error(`❌ Ошибка парсинга страницы ${pageNum} аукциона ${internalAuctionNumber}:`, error.message);
            return [];
        }
    }

    // Парсим ВСЕ страницы аукциона
    async parseAllAuctionPages(internalAuctionNumber) {
        console.log(`\n🔍 Парсим аукцион ${internalAuctionNumber}: https://www.wolmar.ru/auction/${internalAuctionNumber}`);
        
        // Определяем количество страниц
        const totalPages = await this.getTotalPages(internalAuctionNumber);
        
        let allLotsData = [];
        
        // Парсим каждую страницу
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            console.log(`📖 Парсим страницу ${pageNum}/${totalPages}...`);
            
            const pageLotsData = await this.parseAuctionPage(internalAuctionNumber, pageNum);
            allLotsData = allLotsData.concat(pageLotsData);
            this.stats.pagesProcessed++;
            
            console.log(`  📊 Страница ${pageNum}: найдено ${pageLotsData.length} лотов`);
            
            // Небольшая пауза между страницами
            if (pageNum < totalPages) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`📊 Всего найдено ${allLotsData.length} лотов с состояниями на всех страницах`);
        return allLotsData;
    }

    // Обновляем лоты из данных аукциона
    async updateLotsFromAuctionData(lotsData) {
        let auctionUpdated = 0;
        let auctionSkipped = 0;
        
        for (const lot of lotsData) {
            try {
                const newCondition = this.extractConditionWithGrade(lot.condition);
                
                // Ищем лот в базе по URL
                const findQuery = `
                    SELECT id, lot_number, condition 
                    FROM auction_lots 
                    WHERE source_url = $1;
                `;
                const findResult = await this.dbClient.query(findQuery, [lot.lotUrl]);
                
                if (findResult.rows.length > 0) {
                    const lotRecord = findResult.rows[0];
                    const oldCondition = lotRecord.condition;
                    
                    if (oldCondition !== newCondition) {
                        // Обновляем состояние
                        const updateQuery = `
                            UPDATE auction_lots 
                            SET condition = $1 
                            WHERE id = $2;
                        `;
                        await this.dbClient.query(updateQuery, [newCondition, lotRecord.id]);
                        console.log(`✅ Лот ${lotRecord.lot_number}: "${oldCondition}" -> "${newCondition}"`);
                        auctionUpdated++;
                        this.stats.updated++;
                    } else {
                        console.log(`⏭️ Лот ${lotRecord.lot_number}: Без изменений ("${oldCondition}")`);
                        auctionSkipped++;
                        this.stats.skipped++;
                    }
                } else {
                    console.log(`⚠️ Лот ${lot.lotNumber}: Не найден в базе данных`);
                    auctionSkipped++;
                    this.stats.skipped++;
                }
                
                this.stats.processed++;
                
                // Сохраняем прогресс каждые 50 лотов
                if (this.stats.processed % 50 === 0) {
                    this.saveProgress();
                    this.printStats();
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обновления лота ${lot.lotNumber}:`, error.message);
                this.stats.errors++;
            }
        }
        
        console.log(`\n📊 Результат аукциона: Обновлено ${auctionUpdated}, Пропущено ${auctionSkipped}`);
        return { updated: auctionUpdated, skipped: auctionSkipped };
    }

    // Обрабатываем один аукцион
    async processAuction(internalAuctionNumber, auctionNumber) {
        console.log(`\n🏆 Обрабатываем аукцион ${auctionNumber} (внутренний номер: ${internalAuctionNumber})`);
        
        // Парсим ВСЕ страницы аукциона
        const lotsData = await this.parseAllAuctionPages(internalAuctionNumber);
        
        if (lotsData.length === 0) {
            console.log('⚠️ Не удалось получить данные с аукциона');
            return;
        }
        
        // Обновляем лоты
        const result = await this.updateLotsFromAuctionData(lotsData);
        
        this.stats.auctionsProcessed++;
        this.saveProgress();
        
        return result;
    }

    // Основной метод запуска
    async run() {
        try {
            await this.init();
            
            console.log('🚀 Запуск РАБОЧЕЙ версии оптимизированного массового обновления состояний');
            console.log('📋 Стратегия: Парсинг ВСЕХ страниц аукционов + связь по URL + правильное сопоставление');
            
            // Получаем список аукционов
            const auctions = await this.getAuctionsToProcess();
            
            if (auctions.length === 0) {
                console.log('❌ Аукционы для обработки не найдены');
                return;
            }
            
            // Обрабатываем каждый аукцион
            for (const auction of auctions) {
                try {
                    await this.processAuction(auction.internal_auction_number, auction.auction_number);
                    
                    // Небольшая пауза между аукционами
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`❌ Ошибка обработки аукциона ${auction.auction_number}:`, error.message);
                    this.stats.errors++;
                }
            }
            
            // Финальная статистика
            console.log('\n🎉 ОБНОВЛЕНИЕ ЗАВЕРШЕНО!');
            this.printStats();
            
            const totalTime = Math.floor((new Date() - this.stats.startTime) / 1000);
            console.log(`⏱️ Общее время: ${Math.floor(totalTime / 60)}м ${totalTime % 60}с`);
            
        } catch (error) {
            console.error('❌ Критическая ошибка:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
        } catch (error) {
            console.error('❌ Ошибка закрытия браузера:', error.message);
        }
        
        try {
            if (this.dbClient) {
                await this.dbClient.end();
            }
        } catch (error) {
            console.error('❌ Ошибка закрытия БД:', error.message);
        }
        
        console.log('🧹 Ресурсы освобождены');
    }
}

// Обработка сигналов прерывания
process.on('SIGINT', () => {
    console.log('\n⚠️ Получен сигнал прерывания. Сохраняем прогресс...');
    process.exit(0);
});

// Запуск скрипта
async function main() {
    const updater = new WorkingOptimizedMassUpdater();
    await updater.run();
}

main();
