const { launchPuppeteer, createPage, cleanupChromeTempFiles } = require('./puppeteer-utils');
const fs = require('fs');

class WolmarLoginSimple {
    constructor() {
        this.browser = null;
        this.page = null;
        this.credentials = {
            username: 'hippo26',
            password: 'Gopapopa326'
        };
    }

    async init() {
        console.log('🚀 Запускаем браузер...');
        this.browser = await launchPuppeteer();
        this.page = await createPage(this.browser);
        
        await this.page.setViewport({ width: 1280, height: 720 });
        console.log('✅ Браузер инициализирован');
    }

    async login() {
        try {
            console.log('🔍 Переходим на главную страницу Wolmar...');
            await this.page.goto('https://www.wolmar.ru/', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Ждем загрузки страницы
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Делаем скриншот главной страницы для диагностики
            await this.page.screenshot({ path: 'wolmar-homepage.png', fullPage: true });
            console.log('📸 Скриншот главной страницы: wolmar-homepage.png');

            console.log('🔍 Ищем кнопку "Авторизация"...');
            
            // Ищем кнопку "Авторизация" по тексту
            const loginButton = await this.page.evaluateHandle(() => {
                const links = document.querySelectorAll('a');
                for (let link of links) {
                    if (link.textContent.includes('Авторизация')) {
                        return link;
                    }
                }
                return null;
            });
            
            if (!loginButton || await loginButton.evaluate(el => el === null)) {
                console.log('❌ Кнопка "Авторизация" не найдена');
                await this.page.screenshot({ path: 'wolmar-no-auth-button.png', fullPage: true });
                return false;
            }

            console.log('✅ Кнопка "Авторизация" найдена');
            console.log('🖱️ Нажимаем на кнопку "Авторизация"...');
            await loginButton.click();

            // Ждем загрузки формы
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Делаем скриншот формы входа
            await this.page.screenshot({ path: 'wolmar-login-form.png', fullPage: true });
            console.log('📸 Скриншот формы входа: wolmar-login-form.png');

            console.log('🔍 Ищем поля формы...');
            
            // Ищем поля по точным селекторам из кода формы
            const usernameField = await this.page.$('input[name="login"]');
            const passwordField = await this.page.$('input[name="password"]');
            
            if (!usernameField) {
                console.log('❌ Поле логина не найдено');
                await this.page.screenshot({ path: 'wolmar-no-username-field.png', fullPage: true });
                return false;
            }
            
            if (!passwordField) {
                console.log('❌ Поле пароля не найдено');
                await this.page.screenshot({ path: 'wolmar-no-password-field.png', fullPage: true });
                return false;
            }

            console.log('✅ Поля формы найдены');
            console.log('📝 Заполняем форму...');
            
            await usernameField.type(this.credentials.username);
            await passwordField.type(this.credentials.password);

            console.log('🔍 Ищем кнопку отправки...');
            
            // Ищем кнопку отправки (input type="image")
            const submitButton = await this.page.$('input[type="image"]');
            
            if (!submitButton) {
                console.log('❌ Кнопка отправки не найдена');
                await this.page.screenshot({ path: 'wolmar-no-submit-button.png', fullPage: true });
                return false;
            }

            console.log('✅ Кнопка отправки найдена');
            console.log('🚀 Отправляем форму...');
            await submitButton.click();

            // Ждем обработки
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log('🔍 Проверяем результат...');
            
            // Проверяем успешность входа
            const pageContent = await this.page.content();
            const successIndicators = [
                'Личный кабинет',
                'Лоты текущего аукциона',
                'История выигрышей',
                'Выход'
            ];

            const isLoggedIn = successIndicators.some(indicator => pageContent.includes(indicator));

            if (isLoggedIn) {
                console.log('✅ Вход успешен!');
                await this.page.screenshot({ path: 'wolmar-logged-in.png', fullPage: true });
                
                // Сохраняем cookies
                const cookies = await this.page.cookies();
                fs.writeFileSync('wolmar-cookies.json', JSON.stringify(cookies, null, 2));
                console.log('🍪 Cookies сохранены');
                return true;
            } else {
                console.log('❌ Вход не удался');
                await this.page.screenshot({ path: 'wolmar-login-failed.png', fullPage: true });
                return false;
            }

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            await this.page.screenshot({ path: 'wolmar-error.png', fullPage: true });
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
        cleanupChromeTempFiles();
    }
}

// Основная функция
async function main() {
    const login = new WolmarLoginSimple();
    
    try {
        await login.init();
        const success = await login.login();
        
        if (success) {
            console.log('🎉 Вход выполнен успешно!');
        } else {
            console.log('❌ Вход не удался');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    } finally {
        await login.close();
    }
}

main().catch(console.error);
