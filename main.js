const path = require('path');
const puppeteer = require('puppeteer');
const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('scrape-amazon', async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.amazon.com.tr/gp/bestsellers', { waitUntil: 'networkidle2' });
    const products = await page.$$eval('.p13n-sc-truncated', elements =>
        elements.map(el => el.innerText.trim())
    );

    await browser.close();
    return products;
});

ipcMain.handle('search-best-price', async (event, productName) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(`https://www.amazon.com.tr/s?k=${encodeURIComponent(productName)}`, { waitUntil: 'networkidle2' });
        
        const prices = await page.$$eval('.a-price-whole, .a-offscreen', elements =>
            elements.map(el => parseFloat(el.innerText.replace('.', '').replace(',', '.')))
        );
        
        const links = await page.$$eval('.s-result-item a.a-link-normal', elements =>
            elements.map(el => el.href)
        );

        await browser.close();

        if (prices.length > 0) {
            const bestPrice = Math.min(...prices);
            const bestPriceIndex = prices.indexOf(bestPrice);
            const bestPriceLink = links[bestPriceIndex];

            return {
                bestPrice: bestPrice,
                bestPriceLink: bestPriceLink
            };
        } else {
            return {
                bestPrice: "Ürün fiyatı bulunamadı.",
                bestPriceLink: "Ürün bulunamadı."
            };
        }
    } catch (error) {
        console.error("Hata:", error);
        await browser.close();
        return {
            bestPrice: "Hata oluştu.",
            bestPriceLink: "Hata oluştu."
        };
    }
});
