const puppeteer = require('puppeteer');
const readline = require('readline');

async function scrapeAmazon() {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // User-Agent ayarlama
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    await page.goto('https://www.amazon.com.tr/gp/bestsellers', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.p13n-sc-truncated');

    const products = await page.$$eval('.p13n-sc-truncated', elements =>
        elements.map(el => el.innerText.trim())
    );

    console.log("\nAmazon En Popüler Ürünler:");
    products.forEach((product, index) => {
        console.log(`${index + 1}. ${product}`);
    });

    const selectedProduct = await getUserInput("\nHangi ürünü aramak istiyorsunuz? (Numara girin): ");
    const productIndex = parseInt(selectedProduct) - 1;
    if (productIndex >= 0 && productIndex < products.length) {
        console.log(`\nSeçilen Ürün: ${products[productIndex]}`);
        await browser.close();
        await searchOtherSites(products[productIndex]);
    } else {
        console.log("Geçersiz seçim!");
        await browser.close();
    }
}

function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(question, answer => {
        rl.close();
        resolve(answer);
    }));
}

async function searchOtherSites(productName) {
    console.log(`\n"${productName}" için en uygun fiyatları araştırıyoruz...`);
    const sites = [
        { name: "Hepsiburada", url: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(productName)}`, selector: 'div[data-test-id="price-current-price"]' },
        { name: "N11", url: `https://www.n11.com/arama?q=${encodeURIComponent(productName)}`, selector: 'div.proDetail span.newPrice ins' }
    ];

    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // User-Agent ayarlama
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    for (let site of sites) {
        try {
            await page.goto(site.url, { waitUntil: 'networkidle2' });
            await page.waitForSelector(site.selector, { timeout: 15000 });

            const price = await page.$eval(site.selector, el => el.innerText.trim());
            console.log(`${site.name}: ${price} - ${site.url}`);
        } catch (error) {
            console.log(`${site.name}: Fiyat bulunamadı veya erişim engellendi.`);
        }
    }

    await browser.close();
    await manualSearch(); // Manuel arama fonksiyonunu çağır
}

async function manualSearch() {
    const productName = await getUserInput("\nManuel olarak hangi ürünü aramak istersiniz?: ");
    await searchOtherSites(productName); // Kullanıcının girdiği ürünü arama
}

scrapeAmazon().catch(error => console.error("Hata:", error));
