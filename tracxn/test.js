const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto('https://tracxn.com/d/companies/oyorooms.com', {
        waitUntil: 'domcontentloaded'
    });

    let count = 0;

    while(count <= 100){
    count++;
    console.log(count);    
    await page.waitFor('.txn--font-18.txn--text-decoration-none');

    await page.evaluate(() => {
        document.querySelectorAll('.txn--font-18.txn--text-decoration-none')[1].click();
    })
    }

    await browser.close();
})()