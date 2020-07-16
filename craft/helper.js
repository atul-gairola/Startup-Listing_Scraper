const notifier = require('node-notifier');

// logs in via linked in
exports.login = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll(".header-user-menu__link")[2].click();
  });

  page.waitFor(5000);

  await page.waitFor(".field__input");

  await page.type(".field__input[name='user[email]']", `${process.env.CRAFT_EMAIL}`, { delay: 100 });

  await page.type(".field__input[name='user[password]']", `${process.env.CRAFT_PASS}`, { delay: 500 });

  await page.click(".auth-form__actions button");

  await page.waitFor(5000);

  await page.waitFor(".company-card__btn-view-profile");

  page.waitFor(5000);

  console.log("logged in");
};

// collects and saves links from the site
exports.collectLinks = async (page, links, LinkModel) => {
  let isThereMore = await page.evaluate(() => {
    return document.querySelector(".search-load-more__btn") ? true : false;
  });

  // let count = 0;

  while (isThereMore) {
    // while (count < 2) {
    // count++;
    await page.click(".search-load-more__btn");
    await page.waitForResponse("https://craft.co/proxy/dodo/query");
    console.log(random() * 1000);
    await page.waitFor(random() * 1000);
    // console.log(res);
    isThereMore = await page.evaluate(() => {
      return document.querySelector(".search-load-more__btn") ? true : false;
    });
  }

  links = await page.$$eval(".company-card__btn-view-profile", (arr) =>
    arr.map((cur) => cur.href)
  );

  console.log(links.length);

  // saving links to the database
  const promises = links.map((cur) => {
    const link = new LinkModel({
      link: cur,
    });
    return link.save();
  });

  // wait for an array of promises to resolve
  await Promise.all(promises);

  console.log("Craft Links are stored");

  await page.waitFor(5000);
};

exports.getData = async (DataModel, page, links) => {
  try {
    // random number b/w 10 & 20
    const random = () => Math.floor(Math.random() * 10 + 10);

    let resumeCount = 0;

    await DataModel.find()
      .sort({ count: -1 })
      .limit(1)
      .then((el) => {
        if (el.length !== 0) {
          resumeCount = el[0].count;
        }
      });

    console.log("links saving from : " + resumeCount);

    for (let i = resumeCount + 1; i < links.length; i++) {
      await page.goto(links[i]);

      await page.waitFor(random() * 1000);

      let name, description, img_url, tags, website ,social_links, details;

      // collecting data
      try{
          name = await page.$eval(
        ".summary__company-name",
        (el) => el.innerText
      );
      }catch{
        name = await page.$eval(
            ".cp-summary__company-name",
            (el) => el.innerText
          );
      }

      try{
      description = await page.$eval(
        ".summary__description",
        (el) => el.innerText
      );
      }catch{
        description = await page.$eval(
            ".cp-summary__description",
            (el) => el.innerText
          );      }

      try{    
      img_url = await page.$eval(
        ".company-navigation__company-logo-image",
        (el) => el.src
      );
      }catch{
      img_url = await page.$eval(
            ".cp-summary__logo",
            (el) => el.src
          );
      }

      try{
      tags = await page.$$eval(".summary__tags li", (elArr) =>
        elArr.map((cur) => cur.innerText)
      );
      }catch{
        tags = await page.$$eval(".cp-summary__tags a", (elArr) =>
        elArr.map((cur) => cur.innerText)
      );
      }

      try{
      website = await page.evaluate(() => {
        const websiteEl = [
          ...document.querySelectorAll(".summary__overview-table-label-cell"),
        ].filter((cur) => {
          if (cur.innerText === "Website") return cur;
        });
        if(websiteEl.length > 0){
            return websiteEl[0].nextSibling.querySelector("a").href;   
        }else{
            return null
        }
        
      });
    }catch{
         website = await page.evaluate(() => {
            const websiteEl = [
              ...document.querySelectorAll(".cp-quick-info__label"),
            ].filter((cur) => {
                if (cur.innerText === "Website") return cur;
            });
            if(websiteEl.length > 0){
                return websiteEl[0].nextSibling.querySelector("a").href;   
            }else{
                return null
            }
          });
    }

    try{
       social_links = await page.$$eval(
        ".summary__social-icons .craft-social-links__link",
        (elArr) => elArr.map((cur) => cur.href)
      );
    }catch{
         social_links = await page.$$eval(
            ".cp-summary__social-links .social-link",
            (elArr) => elArr.map((cur) => cur.href)
          );
    }

    try{
       details = await page.$$eval(
        ".summary__overview-table-row",
        (elArr) =>
          elArr.map((cur) => ({
            label: cur.querySelector(".summary__overview-table-label-cell")
              .innerText,
            value: cur.querySelector(".summary__overview-table-content-cell")
              .innerText,
          }))
      );
    }catch{
         details = await page.$$eval(
            ".cp-quick-info__item",
            (elArr) =>
              elArr.map((cur) => ({
                label: cur.querySelector(".cp-quick-info__label")
                  .innerText,
                value: cur.querySelector(".cp-quick-info__value")
                  .innerText,
              }))
          );
    }

      const retrieving_competitors = async () => {
        const competitor_section = await page.$$eval(
          ".company-navigation__link",
          (elArr) => elArr.map((cur) => cur.innerText)
        );

        if (competitor_section.includes("Competitors")) {
          await page.evaluate(() => {
            [...document.querySelectorAll(".company-navigation__link")]
              .filter((cur) => {
                if (cur.innerText === "Competitors") return cur;
              })[0]
              .click();
          });
          await page.waitForNavigation({
            waitUntil: "networkidle0",
          });
          await page.waitFor(5000);
          const res = await page.$$eval(
            ".compare-companies__chips-item",
            (elArr) => elArr.map((cur) => cur.innerText)
          );
          return res;
        } else {
          return null;
        }
      };

      const retrieving_key_people = async () => {
        const key_people_section = await page.$$eval(
          ".company-navigation__link",
          (elArr) => elArr.map((cur) => cur.innerText)
        );

        if (key_people_section.includes("Key People")) {
          await page.evaluate(() => {
            [...document.querySelectorAll(".company-navigation__link")]
              .filter((cur) => {
                if (cur.innerText === "Key People") return cur;
              })[0]
              .click();
          });
          await page.waitForNavigation({
            waitUntil: "networkidle0",
          });
          await page.waitFor(3000);
          const res = await page.$$eval(".key-people__item", (elArr) =>
            elArr.map((cur) => {
              return {
                name: cur.innerText.split("\n")[0],
                role: cur.innerText.split("\n")[1],
              };
            })
          );

          return res;
        } else {
          return null;
        }
      };

      const key_people = await retrieving_key_people();

      const competitors = await retrieving_competitors();

      const data = {
        name: name,
        count: i,
        description: description,
        img_url: img_url,
        tags: tags,
        website: website,
        social_links: social_links,
        details: details,
        competitors: competitors,
        key_people: key_people,
      };

      // console.log(data);
      await DataModel.exists({ name: data.name }).then((exists) => {
        if (!exists) {
          const dataFinal = new DataModel(data);
          dataFinal.save((err) => {
            if (err) console.log("Error while saving to the database : " + err);
            else console.log("Craft Data saved successfully to the DB");
          });
        } 
        else 
        console.log("not saved");
      });
      await page.waitFor(random() * 1000);
    }
  } catch (err) {
    const url = await page.url();
    notifier.notify({
      title: 'Error in craft scrapper',
      message: `Err in \n${url}`  
    })
    console.log('Error in :' + url);
    throw `Err : ${err} \n Terminating craft scrapper`;
  }
};
