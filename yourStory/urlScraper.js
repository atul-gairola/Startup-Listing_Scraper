const puppeteer = require("puppeteer");
// const notifier = require("node-notifier");

const { LinkModel } = require("./schema");

// generates a number between 1 and 10
const randomnessGenerator = () => {
  return Math.floor(Math.random() * 10 + 1);
};

const urlScraper = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let resumeCount = 1;

    try {
      await LinkModel.find({})
        .sort({ r_c: -1 })
        .limit(1)
        .then((arr) => {
            // console.log(arr);
          if (arr.length > 0) {
            resumeCount = arr[0].r_c;
          }
        });
    } catch (err) {
      throw `Error error occured in finding links. \n ${err} `;
    }

    console.log("Resume Count: " + resumeCount);

    for (let i = resumeCount; i <= 25; i++) {
      try {
        await page.goto(
          `https://yourstory.com/companies/search?page=${i}`,
          {
            waitUntil: "networkidle0",
          }
        );

        await page.waitForSelector(".hit");

        await page.waitFor(randomnessGenerator() * 1000);

        const onPagelinks = await page.$$eval(".hit", (domArr) =>
          domArr.map((cur) => cur.querySelector('a').href)
        );

        console.log(onPagelinks.length);

        for(const link of onPagelinks){
          await LinkModel.exists({ link: link }).then((linkExists) => {
          if (!linkExists) {
            const newLink = new LinkModel({
              link: link,
              r_c: i,
            });
            return newLink.save((err) => {
              if (err) console.log("Error while Saving the link");
              else console.log("Link saved successfully");
            });
          } else {
            console.log("Link exists in the DB");
          }
        });
        await page.waitFor(randomnessGenerator()*1000 + 5000);
        };

      } catch (err) {
        console.log(err);
        // notifier.notify({
        //   title: "Error in url scrapper - YOUR STORY",
        //   message: `Page : ${i}`,
        // });
        throw err;
      }
    }

    await browser.close();

  } catch (err) {
    console.log("Error occured in Links Scrapper - YOUR STORY. Err : " + err);
    console.log("Restarting the scraper....");
    await urlScraper();
  }
};

exports.urlScraper = urlScraper;
exports.randomnessGenerator = randomnessGenerator;