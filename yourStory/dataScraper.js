require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);
const puppeteer = require("puppeteer");

const { randomnessGenerator } = require("./urlScraper");
const { DataModel, LinkModel } = require("./schema");

let errReps = 0;

const dataScraper = async () => {
    
    // checks for error repetitions
    errReps++;
    console.log('err rep: ' + errReps);

    // browser launch
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--start-maximized"],
      });
  
      const page = await browser.newPage();
  
    try {
    // store links from DB
    const links = await LinkModel.find({}, () => {
      console.log("Links fetched from the DB");
    });

    console.log(links.length);
    
    // set navigation timeout to 0
    page.setDefaultNavigationTimeout(0);

    // set up resume count to start scraping from last left position
    let resumeCount = 0;

    await DataModel.find()
      .sort({ r_c: -1 })
      .limit(1)
      .then((doc) => {
        if (doc.length > 0) resumeCount = doc[0].r_c;
      });

    console.log(resumeCount);

    for (let l = resumeCount + 1; l < links.length; l++) {
      // go to the target url
      await page.goto(links[l].link);

      try{
      await page.waitForXPath(
        '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/a/span[1]'
      );
      }catch(e){
        console.log('Page does not exist');
        continue;
      }

      await page.waitFor(randomnessGenerator() * 1000);

      // sets slug
      const url = page.url();
      let slug = "";
      const urlArr = url.split("/");
      if (url.charAt(url.length - 1) === "/") {
        slug = urlArr[urlArr.length - 2];
      } else {
        slug = urlArr[urlArr.length - 1];
      }

      // Check if the data is already present in DB

      if (!(await DataModel.exists({ slug: slug }))) {
        // if data doesnt exist

        // DOM nodes
        const nodes = {
          readMoreButtons: await page.$x('//span[text()="Read more"]'),
          seeMoreButtons: await page.$x('//p[text()="See "]'),
          name: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/a/span'
          ),
          img: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[1]/img/@src'
          ),
          pitch: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/div[1]/span/div'
          ),
          description: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[4]/div[2]/div[1]/div'
          ),
          tags: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/div[2]/a'
          ),
          socials: await page.$x(
            '//*[@id="root"]/main/div/div/div/div[1]/div[1]/div[1]/div[2]/div[3]/a'
          ),
          basicDetailsHeading: await page.$x('//div[@class="ml-2"]'),
          revenueStreamHeading: await page.$x(
            '//div[@class="ml-2"]/span[text()="Revenue Stream"]'
          ),
          totalFunding: await page.$x('//p[text()="Total Funding"]'),
          investors: await page.$x('//span[text()="Investors"]'),
        };

        // expanding all read mores
        try {
          for (let i = 0; i < nodes.readMoreButtons.length; i++) {
            await page.evaluate(
              (node) => node.click(),
              nodes.readMoreButtons[i]
            );
          }
        } catch (err) {
          console.log("No read more buttons");
        }

        // expanding all see mores
        try {
          for (let i = 0; i < nodes.seeMoreButtons.length; i++) {
            await page.evaluate(
              (node) => node.click(),
              nodes.seeMoreButtons[i]
            );
          }
        } catch (err) {
          console.log("No see more buttons");
        }

        // collecting data

        // data vars
        let name, img, pitch, description, basicDetails, funding, investors;
        let tags = [];
        let socials = [];

        // collecting name
        name = await page.evaluate((node) => node.textContent, nodes.name[0]);

        // collecting img
        img = await page.evaluate((node) => node.textContent, nodes.img[0]);

        // collecting pitch
        pitch = await page.evaluate((node) => node.textContent, nodes.pitch[0]);

        // collecting description
        try {
          description = await page.evaluate(
            (node) => node.textContent,
            nodes.description[0]
          );
        } catch (err) {
          description = null;
        }

        // collecting tags
        try {
          if (nodes.tags.length > 0) {
            for (let i = 0; i < nodes.tags.length; i++) {
              tags.push(
                await page.evaluate((node) => node.textContent, nodes.tags[i])
              );
            }
          } else {
            tags = null;
          }
        } catch (err) {
          console.log("err in tags: " + err);
          tags = null;
        }

        // collecting socials
        try {
          if (nodes.socials.length > 0) {
            for (let i = 0; i < nodes.socials.length; i++) {
              socials.push(
                await page.evaluate((node) => node.href, nodes.socials[i])
              );
            }
          } else {
            socials = null;
          }
        } catch (err) {
          console.log("Error in socials : " + err);
          socials = null;
        }

        // collecting basic details
        try {
          basicDetails = await page.evaluate((node) => {
            const basicDetailsContianer = node.nextSibling.children[2];
            let detailCollectorArr = [
              ...basicDetailsContianer.childNodes,
            ].filter((cur, i) => i % 2 === 0);
            const coreTeamDetails = detailCollectorArr.splice(
              detailCollectorArr.length - 2
            );
            detailCollectorArr = detailCollectorArr.map(
              (cur) => cur.textContent
            );
            const details = {};
            detailCollectorArr.forEach((cur, i, arr) => {
              if (i % 2 === 0) {
                const str = cur.replace(".", " ");
                details[str] = arr[i + 1];
              }
            });
            const tempArr = [...coreTeamDetails[1].childNodes[0].children];
            if (tempArr.length > 3) {
              tempArr.pop();
            }
            try {
              details.coreTeam = tempArr.map((cur) => {
                const individualRow =
                  cur.children[0].childNodes[0].childNodes[1].children;
                let linkedIn;
                try {
                  linkedIn = individualRow[1].href;
                } catch (err) {
                  linkedIn = null;
                }
                const name = individualRow[0].children[0].textContent;
                const title = individualRow[0].children[1].textContent;

                return {
                  name,
                  title,
                  linkedIn,
                };
              });
            } catch (err) {
              details.coreTeam = null;
            }

            return details;
          }, nodes.basicDetailsHeading[0]);
        } catch (err) {
          basicDetails = null;
        }

        // collecting funding
        if (nodes.totalFunding.length > 0) {
          funding = await page.evaluate(
            (node) => node.nextSibling.textContent,
            nodes.totalFunding[0]
          );
        } else {
          funding = null;
        }

        // collecting investors
        if (nodes.investors.length > 0) {
          investors = await page.evaluate((node) => {
            const rows = [
              ...node.parentElement.nextSibling.nextSibling.children[0]
                .children,
            ];
            rows.pop();
            const investorsArr = rows.map((cur) => {
              let name, linkedin;
              name =
                cur.children[0].children[0].children[1].children[0].textContent;
              try {
                linkedin =
                  cur.children[0].children[0].children[1].children[1].href;
              } catch (e) {
                linkedin = null;
              }

              return {
                name,
                linkedin,
              };
            });
            return investorsArr;
          }, nodes.investors[0]);
        } else {
          investors = null;
        }

        const data = {
          r_c: l,
          name,
          img,
          pitch,
          description,
          basicDetails,
          funding,
          investors,
          socials,
          tags,
          slug,
        };

        // new document
        const newCompany = new DataModel(data);

        // saving document
        await newCompany
          .save()
          .then(() => console.log("New Company saved into the DB"))
          .catch((e) => console.log("Error saving company to the DB : " + e));

        //  random time lag
        await page.waitFor(randomnessGenerator() * 1000 + 5000);
      } else {
        // if data already present
        console.log("Data exists in DB");
      }
    }
    await browser.close();

    // success message
    await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
        to: `whatsapp:${process.env.MY_PHONE_NUM}`,
        body: `COLLECTED ALL COMAPNY DATA FROM YOUR STORY 🔥🐉`,
      });
      console.log("Message sent");
  } catch (err) {
    if(errReps < 4){
    console.log("Error occured in Data Scrapper - YOUR STORY. Err : " + err);
    console.log("Restarting the scraper....");
    await dataScraper();
    }else{
    const url = page.url();   
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
      to: `whatsapp:${process.env.MY_PHONE_NUM}`,
      body: `🐞🐞 BUG IN THE APPLICATION AT URL \n ${url} \n ${err}`,
    });
    console.log("Message sent");
    await browser.close();
    throw '';
    }
  }
};

exports.dataScraper = dataScraper;
