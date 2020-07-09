require("dotenv").config();
const puppeteer = require("puppeteer");

const { DataModel } = require("./schema");

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  await page.goto(
    "https://www.startupindia.gov.in/content/sih/en/search.html?roles=Startup&page=0",
    {
      waitUntil: "networkidle0",
    }
  );

  let loadMoreButton = await page.$("#loadMoreNew");

  // testing
  // let count = 0;

  while (loadMoreButton !== null) {
    // testing
    // while (count < 4) {

    await page.waitFor(3000);
    await page.click("#loadMoreNew");
    await page.waitForResponse(
      "https://api.startupindia.gov.in/sih/api/noauth/search/profiles"
    );
    await page.waitFor(3000);
    loadMoreButton = await page.$("#loadMoreNew");

    // testing
    // count++;
    console.log(count);
  }

  const links = await page.$$eval(".category-card a", (arr) =>
    arr.map((cur) => cur.href)
  );

  console.log(links, links.length);

  for (let i = 0; i < links.length; i++) {
    await page.goto(links[i], {
      waitUntil: "networkidle0",
    });

    await page.waitFor(".company-name p");

    const name = await page.$eval(".company-name p", (el) => el.innerText);
    // console.log("done");
    const img = await page.$eval(".image-wrapper img", (el) => el.src);
    // console.log("done");
    const website =
      (await page.$(".website")) !== null
        ? await page.$eval(".website", (el) => el.href)
        : null;
    // console.log("done");
    const description = await page.$eval(
      ".read.margin-t20",
      (el) => el.innerText
    );
    // console.log("done");
    const dpiit_recognised = (await page.$(".dpiit-recog"))
      ? await page.$eval(".dpiit-recog", (el) => el.innerText)
      : "not recognised";
    // console.log("done");
    const details = await page.$$eval(".content-section", (arr) =>
      arr.map((cur) => {
        return {
          title: cur.querySelector(".title").innerText,
          content: cur.querySelector(".content").innerText,
        };
      })
    );
    // console.log("done");
    const multipleMembers = await page.$$(".member");
    let members = [];
    if (multipleMembers.length > 0) {
      members = await page.$$eval(".member", (arr) =>
        arr.map((cur) => JSON.parse(cur.dataset.member))
      );
    } else {
      members = await page.evaluate(() => {
        const container = document.querySelector(".single-team-member");
        const name = container.querySelector(".member-info h4").innerText;
        const role = container.querySelector(".member-info span").innerText;
        const pic = container.querySelector(".img-wrap img").href;
        const profile = container.querySelector(".member-info p").innerText;
        let socialInfos = [
          {
            social: "Linkedin",
            url: "",
          },
          {
            social: "Twitter",
            url: "",
          },
        ];
        if (container.querySelectorAll(".social-wrap a") > 0) {
          socialInfos = [...document.querySelectorAll(".social-wrap a")].map(
            (cur) => {
              return {
                social: cur.className.split(" ")[1].split("-")[0],
                url: cur.href,
              };
            }
          );
        }
        // console.log("done");
        return {
          name,
          pic,
          profile,
          role,
          socialInfos,
        };
      });
    }

    const data = {
      name,
      img,
      website,
      description,
      details,
      dpiit_recognised,
      members,
    };

    // testing
    // console.log(data);

    const finalData = new DataModel(data);

    await finalData.save((err) => {
      if (err) console.log("Error saving the data. Err: " + err);
      else console.log("Data from startupIndia saved to the DB");
    });
  }

  await waitFor(10000);
  await browser.close();
};

/*
img - document.querySelector('.image-wrapper img').src;
name -  document.querySelector('.company-name p').innerText;
website - document.querySelector('.website').href;
description - document.querySelector('.read.margin-t20').innerText;
dpiit_recognised - document.querySelector('.dpiit-recog').innerText;
details - document.querySelectorAll('.content-section');
ifmembers - document.querySelectorAll('.member')
members - [...document.querySelectorAll('.member')].map(cur => JSON.parse(cur.dataset.member));
member - docment.querySelector('.single-team-member');
*/
