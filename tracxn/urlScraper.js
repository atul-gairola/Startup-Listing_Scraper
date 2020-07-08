const puppeteer = require("puppeteer");

const { LinksModel } = require("./schema");

module.exports = async () => {

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // Configure the navigation timeout
  page.setDefaultNavigationTimeout(0);

  const yahooUrl =
    "https://in.search.yahoo.com/search;_ylt=AwrPhSy9yfle2kUAv3m7HAx.;_ylu=X3oDMTEzZzNnZms4BGNvbG8Dc2czBHBvcwMxBHZ0aWQDBHNlYwNwYWdpbmF0aW9u?p=site%3Ahttps%3A%2F%2Ftracxn.com%2Fd%2Fcompanies&pz=10&ei=UTF-8&fr=yfp-t&fp=1&b=11&pz=10&xargs=0";

  const googleUrl =
    "https://www.google.com/search?q=site%3Atracxn.com%2Fd%2Fcompanies&rlz=1C1CHBF_enIN894IN894&oq=site%3A&aqs=chrome.0.69i59l3j69i57j69i58j69i60j69i65l2.8039j0j4&sourceid=chrome&ie=UTF-8";

  // empty array for links collection
  let startupLinks = [];

  let pageCount = 0;

  // gets links from yahoo search
  const getStartupLinks_Yahoo = async () => {
    await page.waitFor(".ac-algo");
    const onPageLinks = await page.evaluate(() => {
      return [...document.querySelectorAll(".ac-algo")].map((domElement) => {
        return {
          link: domElement.href,
          src: "Yahoo",
        };
      });
    });

    // console.log(onPageLinks);  testing

    startupLinks = startupLinks.concat(onPageLinks);

    while (pageCount < 99) {
      pageCount++;
      console.log(pageCount);
      await page.waitFor(".next");
      await page.click(".next");
      await getStartupLinks_Yahoo();
    }

    return;
  };

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

    startupLinks = startupLinks.concat(onPageLinks);

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

  //yahoo search
  await page.goto(yahooUrl);
  await getStartupLinks_Yahoo();

  //google search
  await page.goto(googleUrl);
  await getStartupLinks_Google();

  // saving links to the database
  const promises = startupLinks.map((cur) => {
    const link = new LinksModel(cur);
    return link.save();
  });

  // wait for an array of promises to resolve
  await Promise.all(promises);

  await page.waitFor(5000);

  await browser.close();
};
