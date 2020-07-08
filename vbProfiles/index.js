const puppeteer = require("puppeteer");

const {DataModel} = require('./schema');

module.exports = async () => {


  const browser = await puppeteer.launch({
    headless: true,
    // args: ['--proxy-server=3.16.78.94:3838']
  });

  const page = await browser.newPage();

  // Configure the navigation timeout
  page.setDefaultNavigationTimeout(0);

  const url =
    "https://www.google.com/search?q=site%3Awww.vbprofiles.com%2Fcompanies%2F&rlz=1C1CHBF_enIN894IN894&oq=site&aqs=chrome.0.69i59l2j69i57j69i60j69i61j69i65l2j69i60.1722j0j4&sourceid=chrome&ie=UTF-8";

  let links = [];

  // gets links from google search
  const getStartupLinks_Google = async () => {
    const onPageLinks = await page.evaluate(() => {
      return [...document.querySelectorAll(".rc")].map((domElement) => {
        return {
          link: domElement.querySelector("a").href,
          src: "Google",
        };
      });
    });

    links = links.concat(onPageLinks);

    const next = await page.evaluate(() =>
      document.querySelector("#pnnext") ? true : false
    );

    if (next) {
      console.log("google next page");
      await page.click("#pnnext");
      await page.waitForNavigation();
      await getStartupLinks_Google();
    } else return;
  };

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  await getStartupLinks_Google();

  console.log(links.length);

  for (let i = 0; i < links.length; i++) {
    
    await page.goto(links[i], {
      waitUntil: "networkidle0",
    });

    const name = await page.$eval(
      "h1.media-heading.ellipsis",
      (el) => el.innerText
    );
    console.log("done");
    const logo = await page.$eval(".img-thumbnail._loaded", (el) => el.src);
    console.log("done");
    const location = await page.$eval(
      ".media-body",
      (el) => el.innerText.split(":")[1]
    );
    console.log("done");

    const about = await page.$eval(
      "[itemprop='articleBody']",
      (el) => el.innerText
    );
    console.log("done");

    const cardDetails = await page.$$eval(".card.info-card", (arr) =>
      arr.map((cur) => cur.innerText.split("\n")[0])
    );
    console.log("done");

    const employees = cardDetails[0];
    console.log("done");

    const totalFunding = cardDetails[2];
    console.log("done");

    const {
      foundedOn,
      alias,
      industry,
      tags,
      address,
      mobile,
      email,
      website,
      blog,
    } = await page.evaluate(() => {
      const callouts = [...document.querySelectorAll(".callout")];
      const foundedOn = callouts[0].querySelector("span").innerText;
      const alias = callouts[1].querySelector("span").innerText;
      const industry = callouts[2].querySelector("span").innerText;
      const tags = callouts[3].querySelector("span").innerText.split("\n");
      const address = document.querySelectorAll(".callout")[6].innerText;
      const mobile = callouts[7].querySelectorAll("div")[0].innerText;
      const email = callouts[7].querySelectorAll("div")[1].innerText;
      const website = callouts[7].querySelectorAll("div")[2].children[1].href
        ? callouts[7].querySelectorAll("div")[2].children[1].href
        : null;
      const blog = callouts[7].querySelectorAll("div")[3].children[1].href
        ? callouts[7].querySelectorAll("div")[3].children[1].href
        : null;

      return {
        foundedOn,
        alias,
        industry,
        tags,
        address,
        mobile,
        email,
        website,
        blog,
      };
    });
    console.log("done");

    let member_details = null;

    const isMemberThere = await page.$$eval('[itemProp="member"]', (arr) =>
      arr.map((cur) => cur.innerText)
    );

    if (isMemberThere.length > 0) {
      member_details = await page.$$eval('[itemProp="member"]', (arr) =>
        arr.map((cur) => ({
          img: cur.children[0].firstElementChild.src,
          name: cur.children[1].children[0].innerText,
          role: cur.children[1].children[1].innerText,
          date: cur.children[1].children[2].innerText,
        }))
      );
    }
    console.log("done");

    let investors = null;

    const isInvestorThere = await page.$$("#investors .media-body");

    if (isInvestorThere.length > 0) {
      investors = await page.evaluate(() => {
        return [
          ...document
            .querySelector("#investors")
            .querySelectorAll(".media-body"),
        ].map((cur) => ({
          name: cur.children[0].innerText,
          date: cur.children[1].innerText,
        }));
      });
    }
    console.log("done");

    let fundings = null;

    const isFundingThere = await page.$$("#fundings-history tbody tr");

    if (isFundingThere.length > 0) {
      fundings = await page.evaluate(() => {
        return [
          ...document.querySelectorAll("#fundings-history tbody tr.active"),
        ].map((cur) => ({
          date: cur.children[0].innerText,
          stage: cur.children[1].innerText,
          //amt: cur.children[2].innerText,
        }));
      });
    }
    console.log("done");

    const data = {
      name,
      logo,
      location,
      employees,
      about,
      totalFunding,
      foundedOn,
      alias,
      industry,
      tags,
      address,
      mobile,
      email,
      website,
      blog,
      member_details,
      investors,
      fundings,
    };

    console.log(data);
 
    const finalData = new DataModel(data);

    await finalData.save(err => {
        if (err)
        console.log(err)
        else 
        console.log('Vb profile Company saved');
    })
    
  }

  await waitFor(20000);

  await browser.close();

};

/*
name - document.querySelector('h1.media-heading.ellipsis');
logo - document.querySelector('.img-thumbnail._loaded').src;
location - document.querySelector('.media-body').innerText.split(':')[1];
about - document.querySelector('.with-gradient.more-than-this.more-than-this-expanded').innerText;
card-details - [...document.querySelectorAll('.card.info-card')].map(cur => (cur.innerText.split('\n')[0]));
employees - card-details[0];
total-funding - card-details[2];
callouts - [...document.querySelectorAll('.callout')];
founded on - callouts[0].querySelector('span').innerText;
alias - callouts[1].querySelector('span').innerText;
industry - callouts[2].querySelector('span').innerText;
tags - callouts[3].querySelector('span').innerText.split('\n');
social-links - callouts[4].querySelectorAll('button').innerText;
address - document.querySelectorAll('.callout')[6].innerText;
mobile - document.querySelectorAll('.callout')[7].querySelectorAll('div')[0].innerText;
email - document.querySelectorAll('.callout')[7].querySelectorAll('div')[1].innerText;
website - document.querySelectorAll('.callout')[7].querySelectorAll('div')[2].children[1].href;
blog - document.querySelectorAll('.callout')[7].querySelectorAll('div')[3].children[1].href;
members - [...document.querySelectorAll('[itemProp="member"]')];
member_details - members.map(cur => ({
    img: cur.children[0].firstElementChild.src,
    name: cur.children[1].children[0].innerText,
    role: cur.children[1].children[1].innerText,
    date: cur.children[1].children[2].innerText
}));
investors - [...document.querySelector('#investors').querySelectorAll('.media-body')].map(cur => ({name: cur.children[0].innerText, date: cur.children[1].innerText}));
fundings - [...document.querySelectorAll('#fundings-history tbody tr')].map(cur => ({
    date : cur.children[0].innerText,
    stage : cur.children[1].innerText,
    amt : cur.children[2].innerText
}))
*/
