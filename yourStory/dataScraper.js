const puppeteer = require('puppeteer');

const {randomnessGenerator} = require('./urlScraper');

const dataScraper = async () => {
    try{

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [--start-maximized]
        });
        
        const page = await browser.newPage();

        await page.goto('https://yourstory.com/companies/payse#');

        await page.waitForXPath('//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/a/span[1]');

        await page.waitFor(randomnessGenerator()*1000);

        const nameNode = await page.$x('//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/a/span');
        console.log(nameNode[0])

    }catch(err){
        console.log("Error occured in Data Scrapper - YOUR STORY. Err : " + err);
        console.log("Restarting the scraper....");
        await dataScraper();
    }
}