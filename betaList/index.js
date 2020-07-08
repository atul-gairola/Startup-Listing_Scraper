const puppeteer = require("puppeteer");

const { StartupModel, MarketModel } = require("./schema");

  module.exports = async () => {

  // browser initialization
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  // Configure the navigation timeout
  page.setDefaultNavigationTimeout(0);

  // Navigate to the assigned url
  await page.goto("https://betalist.com/markets");

  // returns data from industry page
  const industry_data = await page.evaluate(() =>{

  // function for formating the name of the industry
    const formatIndustryName = (innerText) => {
    const formattedString = innerText
      .split(" ")
      .splice(1)
      .join(" ")
      .split("\n");
      
    const count = formattedString.pop();

    return {
      name: formattedString.join(' '),
      count: Number(count)
    };
  };

  const data = [...document.querySelectorAll(".tag--card")].map((cur) => {
      return {
        industryName: formatIndustryName(cur.innerText).name,
        count: formatIndustryName(cur.innerText).count,
        industryLink: cur.href,
      };
    });

    return data;
  }
  );


   // saving industries in db
    const industriesPromises = industry_data.map(async(cur) => {
    const industry = new MarketModel(cur);
     
    return industry.save((err) => {
      if (err) console.log(err);
      else console.log("industry added to industries collection");
    });
   });

   // wait for an array of promises to resolve
    await Promise.all(industriesPromises);

    await page.waitFor(7000);

  // looping through all the industry links
  for (let i = 0; i < industry_data.length; i++) {
    await page.goto(industry_data[i].industryLink);
    await page.waitFor(1000);

    // storing the links of all startups for current industry in the loop
    const startup_links = await page.evaluate(() =>
      [...document.querySelectorAll(".startupCard__visual")].map(
        (cur) => cur.href
      )
    );

    //looping through all the startup links and storing data of each startup
    for (let j = 0; j < startup_links.length; j++) {
      await page.goto(startup_links[j], { waitUntil: "networkidle2" });

      // returns data from individual startup page
      const startupData = await page.evaluate(() => {

        // dom elements to be scraped
        const DOM = {
          DOMName: document.querySelector(".startup__summary__name"),
          DOMImage: [...document.querySelectorAll(".carousel__item")],
          DOMPitch: document.querySelector(".startup__summary__pitch"),
          DOMDescription: document.querySelector(".startup__description"),
          DOMSiteLink: document.querySelector(".button2--contrast"),
          DOMTwitterLink: document.querySelector(".button2--twitter"),
          DOMFacebookLink: document.querySelector(".button2--facebook"),
          DOMMakers: [...document.querySelectorAll(".maker")],
        };

        return {
          name: DOM.DOMName ? DOM.DOMName.textContent : null,
          images:  DOM.DOMImage.length > 0
              ? DOM.DOMImage.map((cur) =>
                  cur.querySelector("img") ? cur.querySelector("img").src : null
                )
              : null,
          pitch: DOM.DOMPitch ? DOM.DOMPitch.innerText : null,
          description: DOM.DOMDescription ? DOM.DOMDescription.innerText : null,
          siteLink: DOM.DOMSiteLink ? DOM.DOMSiteLink.href : null,
          socials: {
            twitter: DOM.DOMTwitterLink ? DOM.DOMTwitterLink.href : null,
            facebook: DOM.DOMFacebookLink ? DOM.DOMFacebookLink.href : null,
          },
          makersDetails: DOM.DOMMakers.length > 0
              ? DOM.DOMMakers.map((cur) => ({
                  avatar: cur.children[0].querySelector("img")
                    ? cur.children[0].querySelector("img").src
                    : null,
                  name: cur.children[1].querySelector(".maker__name")
                    ? cur.children[1].querySelector(".maker__name").innerText
                    : null,
                  role: cur.children[1].querySelector(".maker__role")
                    ? cur.children[1].querySelector(".maker__role").innerText
                    : null,
                }))
              : null,
        };
      });

      //individual startup data with industry reference
      const startupDataWithIndustry = {
        industryName: industry_data[i].industryName,
        ...startupData,
      };

      //  saving startup data to mongoDB
      const startup = new StartupModel(startupDataWithIndustry);
      startup.save((err) => {
        if (err) console.log(err);
        else console.log("startup added to startups collection");
      });
    }
  }

  await browser.close();
};
