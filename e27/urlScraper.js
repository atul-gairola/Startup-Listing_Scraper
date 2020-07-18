require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);
const puppeteer = require('puppeteer');

const {randomnessGenerator} = require('../yourStory/urlScraper');
const {LinkModel} = require('./schema');

const urlScraper = async() => {
    // launch browser
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    const page = await browser.newPage();

    // set navigation timeout to 0
    page.setDefaultNavigationTimeout(0);

    try{
      
        // go to the target
        await page.goto('https://e27.co/startups/?location[]=India&pro=0&tab_name=recentlyupdated',{
            waitUntil: 'networkidle0'
        });

        // waits between 3 - 13 secs
        await page.waitFor(randomnessGenerator()*1000 + 3000);

        let loadMore = await page.$(".load-more-btn.hide");

        console.log(loadMore);

        // to limit the repetitions in case code doesnt work as expeected
        let count = 0;

        while(!loadMore && count < 1500){
            count++;
            console.log('Repetitions: ' + count);
            // click on load more button
            await page.click('.load-more');
            // wait for random amt
            await page.waitFor(randomnessGenerator()*1000 + 3000);
            // set loadMore
            loadMore = await page.$(".load-more-btn.hide");
        }

        // collect links
        const links = await page.evaluate(() =>
           [...document.querySelectorAll(".startuplink")].map((cur) => cur.href)
        );

        console.log( 'No. of links : '+ links.length);

        // save links to DB
        for(const link of links){
            const newLink = new LinkModel({
                link: link
            });

            // check if link already exists in DB
            if(!await LinkModel.exists({link: link})){
                await newLink.save((err) => {
                   if (err)
                   console.log('Error occures in saving to the DB : ' + err);
                   else
                   console.log('New Link saved to the DB');
                })
            }else{
                console.log('link already exists in the DB');
            }
        }

        // success message
        await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
            to: `whatsapp:${process.env.MY_PHONE_NUM}`,
            body: `COLLECTED ALL LINKS FROM E27 🔥🐉`,
          });
          console.log("Message sent");

        //   await browser.close();

    }catch(err){
        console.log('Err in url scrapper in E27 : ' +err);
        await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
        to: `whatsapp:${process.env.MY_PHONE_NUM}`,
        body: `🐞🐞 BUG IN THE APPLICATION \n ${err}`,
        });
        console.log("Message sent");
        await browser.close();
        throw '';
    }
}

exports.urlScraper = urlScraper;