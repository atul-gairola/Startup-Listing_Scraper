require("dotenv").config();
const puppeteer = require("puppeteer");
const notifier = require('node-notifier');

const { LinksModel, CompanyModel } = require("./schema");

module.exports = async () => {
  // temporary link storage
  let links = [];

  // gets links from the DB
  await LinksModel.find({}, (err, docs) => {
    links = docs;
  });

  console.log('Links imported from the DB');

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  // Configure the navigation timeout
  page.setDefaultNavigationTimeout(0);

  let resumeCount = 0;

  await CompanyModel.find({})
  .sort({s_num: -1})
  .limit(1)
  .then(el => {
    if(el.length > 0){
      resumeCount = el[0].s_num;
      console.log('Restarting from ' + resumeCount);
    }
  });

  // looping through the links
  for (let i = resumeCount; i < links.length; i++) {
    
    try{
    // going to the current page
    await page.goto(links[i].link, {
      waitUntil: 'networkidle0',
    });

    let count = 0;

    // iterating 'next' for 100 times through each link
    while (count < 100) {
     try{ 
      await page.waitFor(".txn--font-18.txn--text-decoration-none");

      count++;

      // sets slug
      const url = page.url();
      let slug = "";
      const urlArr = url.split("/");
      if (url.charAt(url.length - 1) === "/") {
        slug = urlArr[urlArr.length - 2];
      } else {
        slug = urlArr[urlArr.length - 1];
      }

      //  console.log(slug); testing

      // scrapes data
      const dataSet = await page.evaluate(() => {
        const DOMElements = {
          title_section: document.querySelector(
            ".txn--seo-companies__banner-content"
          ),
          img: document.querySelector('[alt="post-image"]'),
          company_links: [
            ...document.querySelectorAll(
              ".txn--seo-companies__banner-content .txn--seo-companies__links"
            ),
          ],
          last_updated: document.querySelector(
            ".txn--seo-companies__banner-logo i"
          ),
          about_section: document.querySelector("p.txn--text-break-word"),
          funding: [...document.querySelectorAll("tr.txn--vertical-align-top")],
          overview: [
            ...document.querySelectorAll("p.txn--seo-companies__overview-info"),
          ],
          board_members: [
            ...document.querySelectorAll("#txn--seo-post-container li"),
          ],
          cap_table: [
            ...document.querySelectorAll(
              ".txn--margin-bottom-lg.txn--margin-top-sm ~ p"
            ),
          ],
          headings: () => {
            const headings = {};
            [...document.querySelectorAll("h2")].map((cur) => {
              if (cur.innerText.includes("Investors")) {
                headings.investors = cur;
              } else if (cur.innerText.includes("Revenue")) {
                headings.revenue = cur;
              }
            });

            return headings;
          },
        };

        const {
          title_section,
          img,
          company_links,
          last_updated,
          about_section,
          overview,
          funding,
          headings,
          board_members,
          cap_table,
        } = DOMElements;

        return {
          name: title_section.querySelector("h1").innerText,
          website: company_links[0].href,
          image_url: img.src,
          last_updated: last_updated.innerText,
          pitch: title_section.querySelector("p").innerText,
          social_links: company_links
            .map((cur) => cur.href)
            .slice(1, company_links.length),
          about: about_section.innerText,
          overview: overview.map((cur) => {
            const format = cur.innerText.split("\n");
            return {
              detail: format[0],
              value: format[1],
            };
          }),
          funding_rounds:funding.length > 0
              ? funding.map((cur) => {
                  const arr = cur.querySelectorAll("td");
                  return {
                    date: arr[0].innerText,
                    funding_amount: arr[1].innerText,
                    funding_round: arr[2].innerText,
                    investor_details: arr[3].innerText,
                  };
                })
              : null,
          investors: headings().investors
            ? [...headings().investors.nextSibling.querySelectorAll("div")].map(
                (cur) => {
                  const text = cur.innerText.split("\n");
                  return {
                    image_url: cur.querySelector("img").src,
                    name: text[0],
                    location: text[1],
                  };
                }
              )
            : null,
          revenue: headings().revenue
            ? {
                year: headings().revenue.nextSibling.nextSibling.nextSibling
                  .textContent,
                amt: headings().revenue.nextSibling.nextSibling.nextSibling
                  .nextSibling.nextSibling.nextSibling.nextSibling.textContent,
              }
            : null,
          board_members:board_members.length > 0
              ? board_members.map((cur) => {
                  const text = cur.innerText.split(",");
                  return {
                    name: text[0],
                    role: text[1],
                  };
                })
              : null,
          cap_table:cap_table.length > 0
              ? cap_table.map((cur) => {
                  const text = cur.innerText.split(")");
                  return {
                    share_holder: text[0],
                    holding: text[1],
                  };
                })
              : null,
        };
      });

      console.log(i);

      // final data
      const companyData = {
        s_num: i,
        slug: slug,
        ...dataSet,
      };

      // gets links from the DB
      const findResult = await CompanyModel.exists({ slug: slug });

      if (findResult) {
        console.log("not saving");
        await page.evaluate(() => {
          document
            .querySelectorAll(".txn--font-18.txn--text-decoration-none")[1]
            .click();
        });
        await page.waitFor(10000);
      } else {
        // saving to the DB
        const data = new CompanyModel(companyData);
        await data.save(() => {
          console.log("company saved");
        });

        await page.evaluate(() => {
          document
            .querySelectorAll(".txn--font-18.txn--text-decoration-none")[1]
            .click();
        });
        await page.waitFor(10000);
      }
    }catch(err){
        console.log('Err : ' + err);
        const url = page.url();
        throw url;
    }  
    }
  }catch(err){
    notifier.notify({
      title: 'Error in craft scrapper',
      message: `Err in \n${err}`  
    });
    console.log('Error in:' + err);
    console.log('Index of the link in the array' + i );
  }
  }

  await browser.close();
};
