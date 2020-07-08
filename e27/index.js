const puppeteer = require("puppeteer");

const {CompanyModel} = require('./schema');

module.exports = async () => {

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  await page.goto(
    "https://e27.co/startups/?location[]=India&pro=0&tab_name=recentlyupdated",
    {
      waitUntil: "domcontentloaded",
    }
  );

  let isThereMore ;

  let count = 0;

  while(isThereMore !== null){
  // for testing
  // while (count < 3) { 
    await page.waitFor(3000);
    await page.evaluate(() => {
      document.querySelector(".load-more-btn").click();
    });
    await page.waitFor(".load-more-btn");
    isThereMore = await page.$(".load-more-btn.hide");
    console.log("done", count++);
  }

  const allLinks = await page.evaluate(() =>
    [...document.querySelectorAll(".startuplink")].map((cur) => cur.href)
  );

  const links = allLinks.slice(1);

  // console.log(links); testing

  for(let i = 0; i < links.length; i++){

      await page.goto(links[i], {
          waitUntil: 'networkidle0'
      });
     
      await page.evaluate(() => {
            if(document.querySelector('.fundings-load-more-btn'))
            document.querySelector('.fundings-load-more-btn').click();
      })

      const companyData = await page.evaluate(() => {
          return {
              name: document.querySelector('.startup-name').innerText,
              pitch: document.querySelector('.startup-short-description').innerText,
              logo_img: document.querySelector('.startup-logo').src,
              about: document.querySelector('.startup-description').textContent,
              date_founded: document.querySelector('.date-founded-wrapper').querySelector('p').innerText,
              website: document.querySelector('.startup-website') ? document.querySelector('.startup-website').href : null,
              social_links: [...document.querySelector('.website-wrapper').querySelectorAll('a')].slice(1).length > 0 ? [...document.querySelector('.website-wrapper').querySelectorAll('a')].slice(1).map(cur => cur.href) : null,
              location: document.querySelector('.startup-startup_location').innerText,
              industry_tags: [...document.querySelector('.vertical-wrapper').querySelectorAll('a')].length > 0 ? [...document.querySelector('.vertical-wrapper').querySelectorAll('a')].map(cur => cur.innerText) : null,
              funding: [...document.querySelectorAll('.funding-active')].length > 0 ? [...document.querySelectorAll('.funding-active')].map(cur => {
                return {
              round: cur.querySelector('.round').innerText,
              amount : cur.querySelector('.amount').innerText,
              date : cur.querySelector('.date').innerText,
              }
              }) : null
          }
      });

      const data = new CompanyModel(companyData);

      await data.save((err) => {
        if(err)
        console.log('Error while saving to the database : ' + err)
        else
        console.log('Data saved successfully to the DB')
      });
      
      // testing
      // console.log(companyData); 
  }
  await browser.close();

};
