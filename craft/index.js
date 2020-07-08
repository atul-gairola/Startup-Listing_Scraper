require('dotenv').config();
const puppeteer = require("puppeteer");

const { DataModel } = require('./schema');

module.exports = async () => {
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();

  await page.goto(
    "https://craft.co/search?locations%5B0%5D=india&order=size_desc",
    {
      waitUntil: "networkidle0",
    }
  );

  page.setDefaultNavigationTimeout(0);

  // logging in
  await page.evaluate(() => {
    document.querySelectorAll(".header-user-menu__link")[2].click();
  });

  await page.waitFor(".craft-button--oauth-linkedin");

  await page.click(".craft-button--oauth-linkedin");

  await page.waitFor("#username");

  await page.type("#username",`${process.env.LINKDEIN_EMAIL}`, { delay: 100 });

  await page.type("#password",`${process.env.LINKEDIN_PASS}`, { delay: 500 });

  await page.click(".btn__primary--large");

  await page.waitForNavigation();

  await page.waitFor(".company-card__btn-view-profile");

 // collecting the links
  let isThereMore = await page.evaluate(() => {
    return document.querySelector(".search-load-more__btn") ? true : false;
  });

  // let count = 0;

  while (isThereMore) {
  // while (count < 2) {
    // count++;
    await page.click(".search-load-more__btn");
    await page.waitForResponse("https://craft.co/proxy/dodo/query");
    await page.waitFor(3000);
    // console.log(res);
    isThereMore = await page.evaluate(() => {
      return document.querySelector(".search-load-more__btn") ? true : false;
    });
  }

  const links = await page.$$eval(".company-card__btn-view-profile", (arr) =>
    arr.map((cur) => cur.href)
  );

  console.log(links, links.length);

  for(let i = 0; i < links.length; i++){
  
 await page.goto(links[i]);

 await page.waitFor('.summary__description');

// collecting data
const name = await page.$eval('.summary__company-name', el => el.innerText);
const description = await page.$eval('.summary__description', el => el.innerText);
const img_url = await page.$eval('.company-navigation__company-logo-image', el => el.src);
const tags = await page.$$eval('.summary__tags li', elArr => elArr.map(cur => cur.innerText));
const website = await page.evaluate(() => {
    const websiteEl = [...document.querySelectorAll('.summary__overview-table-label-cell')].filter(cur => { if (cur.innerText === 'Website') return cur } );
    return websiteEl[0].nextSibling.querySelector('a').href;
});
const social_links = await page.$$eval('.summary__social-icons .craft-social-links__link', elArr => elArr.map(cur => cur.href));
const details = await page.$$eval('.summary__overview-table-row', elArr => elArr.map(cur => ({
    label : cur.querySelector('.summary__overview-table-label-cell').innerText,
    value : cur.querySelector('.summary__overview-table-content-cell').innerText
})));

const retrieving_competitors = async() => {

    const competitor_section = await page.$$eval('.company-navigation__link', elArr => elArr.map(cur => cur.innerText ));

    if(competitor_section.includes('Competitors')){
        await page.evaluate(() => {
            [...document.querySelectorAll('.company-navigation__link')].filter(cur => {if(cur.innerText === 'Competitors') return cur})[0].click();
        });
        await page.waitForNavigation({
            waitUntil: 'networkidle0'
        });
        await page.waitFor(3000);
        const res = await page.$$eval('.compare-companies__chips-item', elArr => elArr.map(cur => cur.innerText));
         return res;
    }else{
        return null;
      }
} 

const retrieving_key_people = async() => {
    
    const key_people_section = await page.$$eval('.company-navigation__link', elArr => elArr.map(cur => cur.innerText ));

if(key_people_section.includes("Key People")){
    await page.evaluate(() => {
        [...document.querySelectorAll('.company-navigation__link')].filter(cur => {if(cur.innerText === 'Key People') return cur})[0].click();
    });
    await page.waitForNavigation({
        waitUntil: 'networkidle0'
    });
    await page.waitFor(3000);
    const res = await page.$$eval('.key-people__item', elArr => elArr.map(cur => {
        return {
            name : cur.innerText.split('\n')[0],
            role : cur.innerText.split('\n')[1]
        } 
     }));

     return res;

}else{
    return null;
  }
}

const key_people = await retrieving_key_people();

const competitors = await retrieving_competitors();


const data = {
    name: name,
    description: description,
    img_url: img_url,
    tags: tags,
    website: website,
    social_links: social_links,
    details: details,
    competitors: competitors,
    key_people: key_people
};

console.log(data);

const dataFinal = new DataModel(data);

 await dataFinal.save((err) => {
    if(err)
    console.log('Error while saving to the database : ' + err)
    else
    console.log('Craft Data saved successfully to the DB')
  });

  }

  await page.waitFor(20000);

  await browser.close();

};


// loged in - document.querySelector('.header-user-menu__link--user');

/*sign in 
signin button - document.querySelectorAll('.header-user-menu__link')[2];
oauth button - document.querySelector('.craft-button--oauth-linkedin');
*/

/* linked in
username - document.querySelector('#username');
password - document.querySelector('#password');
button - document.querySelector('.btn__primary--large');
*/

/*overview
name - document.querySelector('.summary__company-name');
description - document.querySelector('.summary__description');
img - document.querySelector('.company-navigation__company-logo-image').src;
tags - document.querySelectorAll('.summary__tags li');
website_tag -  [...document.querySelectorAll('.summary__overview-table-label-cell')].filter(cur => { if (cur.innerText === 'Website') return cur } );
website link - website_tag.nextSibling.querySelector('a').href;
social links - document.querySelectorAll('.summary__social-icons .craft-social-links__link');
overview - document.querySelectorAll('.summary__overview-table-row');
competitors nav  - [...document.querySelectorAll('.company-navigation__link')].filter(cur => {if(cur.innerText === 'Competitors') return cur});
competitors - [...document.querySelectorAll('.compare-companies__chips-item')].map(cur => cur.innerText);
key people nav - [...document.querySelectorAll('.company-navigation__link')].filter(cur => {if(cur.innerText === 'Key People') return cur});
key people - [...document.querySelectorAll('.key-people__item')].map(cur => cur.innerText.split('\n'));
*/