require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const { login, collectLinks, getData } = require("./helper");
const { DataModel, LinkModel } = require("./schema");

puppeteer.use(StealthPlugin());

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  try {
    await page.goto(
      "https://craft.co/search?locations%5B0%5D=india&order=size_desc",
      {
        waitUntil: "networkidle0",
      }
    );

    page.waitFor(5000);

    // logging in
    await login(page);

    let links = [];

    // collect links
    // await collectLinks(page, links, LinkModel);

    // get links from DB
    await LinkModel.find({}, (err, docs) => {
      if (err) console.log(err);
      else {
        links = docs.map((cur) => cur.link);
        console.log("Links collected from DB");
      }
    });

    await page.waitFor(10000);

    // await LinkModel.deleteOne({ link: "https://craft.co/" }, (err) => {
    //   if (err) console.log("error while deleting : " + err);
    //   else console.log("Deleted successfully");
    // });

    // await LinkModel.find({link: 'https://craft.co/search?'}, (err, docs) => {
    //   if (err)
    //   console.log("Err retreiving data" + err);
    //   else
    //   console.log('number of Faulty links: ' + docs.length);
    // })

    await getData(DataModel, page, links);

    await page.waitFor(20000);

    await browser.close();
  } catch (err) {
    // log the error
    console.log("Error occured in craft website: " + err);
    // close the browser
    await browser.close();
    console.log("Browser is closed for Craft scraper");
  }
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
