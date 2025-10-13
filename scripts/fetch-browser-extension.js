#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

async function fetchWithBrowserExtension(categoryId = '252', finished = true) {
    console.log('🌐 Using browser with extension approach...');
    
    const url = `https://meshok.net/good/${categoryId}${finished ? '?opt=2' : ''}`;
    console.log(`📄 Fetching: ${url}`);
    
    try {
        // Настройки браузера для обхода защиты
        const browser = await puppeteer.launch({
            headless: false, // Важно: не headless для обхода защиты
            args: ['--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-back-forward-cache',
                '--disable-ipc-flooding-protection',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--disable-translate',
                '--disable-windows10-custom-titlebar',
                '--disable-extensions-except=./chrome-extension',
                '--load-extension=./chrome-extension',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--user-data-dir=/tmp/chrome-temp-womoa',
      '--disable-metrics',
      '--disable-metrics-reporting',
      '--disable-background-mode',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-logging',
      '--disable-gpu-logging',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor'],
            ignoreDefaultArgs: ['--disable-extensions'],
            executablePath: '/usr/bin/google-chrome-stable' // Путь к Chrome
        });
        
        const page = await browser.newPage();
        
        // Настройка viewport
        await page.setViewport({
            width: 1366,
            height: 768,
            deviceScaleFactor: 1
        });
        
        // Дополнительные заголовки
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1'
        });
        
        // Отключение изображений для ускорения
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet') {
                req.abort();
            } else {
                req.continue();
            }
        });
        
        console.log('⏳ Navigating to page...');
        
        // Сначала заходим на главную страницу для установки сессии
        await page.goto('https://meshok.net/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Main page loaded, waiting...');
        await page.waitForTimeout(2000);
        
        // Теперь переходим к целевой странице
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Target page loaded');
        
        // Ждем загрузки контента
        await page.waitForTimeout(3000);
        
        // Проверяем на Cloudflare
        const content = await page.content();
        if (content.includes('Just a moment') || content.includes('Один момент')) {
            console.log('⚠️  Cloudflare challenge detected, waiting...');
            await page.waitForTimeout(10000);
        }
        
        // Получаем финальный контент
        const finalContent = await page.content();
        
        // Сохраняем результат
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `browser_extension_good${categoryId}_opt${finished ? '2' : '1'}_${timestamp}.html`;
        const filepath = path.join('data', filename);
        
        await fs.ensureDir('data');
        await fs.writeFile(filepath, finalContent, 'utf8');
        
        console.log(`✅ Saved to: ${filename}`);
        console.log(`📊 Size: ${(finalContent.length / 1024).toFixed(2)} KB`);
        
        // Анализ содержимого
        const title = await page.title();
        console.log(`📋 Page title: ${title}`);
        
        // Поиск ссылок на лоты
        const itemLinks = await page.$$eval('a[href*="/item/"]', links => links.length);
        console.log(`🔗 Item links found: ${itemLinks}`);
        
        if (itemLinks > 0) {
            console.log('🎉 Successfully obtained auction data with browser extension!');
            
            // Получаем первые несколько ссылок
            const firstLinks = await page.$$eval('a[href*="/item/"]', links => 
                links.slice(0, 5).map(link => link.href)
            );
            
            console.log('📋 First 5 item links:');
            firstLinks.forEach((link, i) => {
                console.log(`   ${i + 1}. ${link}`);
            });
        } else {
            console.log('⚠️  No auction links found');
        }
        
        // Поиск цен
        const prices = await page.$$eval('*', elements => {
            const text = elements.map(el => el.textContent).join(' ');
            const priceMatches = text.match(/[0-9,]+[ ]*₽|[0-9,]+[ ]*руб/g);
            return priceMatches ? priceMatches.slice(0, 3) : [];
        });
        
        if (prices.length > 0) {
            console.log(`💰 Prices found: ${prices.length}`);
            console.log('📋 Sample prices:');
            prices.forEach((price, i) => {
                console.log(`   ${i + 1}. ${price}`);
            });
        }
        
        // Поиск таблиц
        const tableCount = await page.$$eval('table', tables => tables.length);
        console.log(`📊 Tables found: ${tableCount}`);
        
        // Поиск форм
        const formCount = await page.$$eval('form', forms => forms.length);
        console.log(`📝 Forms found: ${formCount}`);
        
        // Поиск JSON данных
        const jsonData = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const jsonMatches = [];
            scripts.forEach(script => {
                const content = script.textContent;
                const matches = content.match(/\{[^{}]*"[^"]*"[^{}]*\}/g);
                if (matches) {
                    jsonMatches.push(...matches);
                }
            });
            return jsonMatches;
        });
        
        if (jsonData.length > 0) {
            console.log(`📜 JSON data found: ${jsonData.length} matches`);
            console.log('📋 Sample JSON:');
            jsonData.slice(0, 2).forEach((json, i) => {
                console.log(`   ${i + 1}. ${json.substring(0, 100)}...`);
            });
        } else {
            console.log('📜 No JSON data found');
        }
        
        await browser.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Запуск
const categoryId = process.argv[2] || '252';
const finished = process.argv[3] !== 'false';
fetchWithBrowserExtension(categoryId, finished);
