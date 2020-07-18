require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);
const puppeteer = require("puppeteer");

const { randomnessGenerator } = require("../yourStory/urlScraper");
const { LinkModel, CompanyModel } = require("./schema");

// err count
let errCount = 0;

const dataScraper = async () => {

  errCount++;
  console.log('Error count = ' + errCount);

  // connect to the browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  // set default nav timeout to 0
  page.setDefaultNavigationTimeout(0);

  try {
    // fetch all links from DB
    const links = await LinkModel.find({}, (err) => {
      if (err) console.log("Error fetching links: " + err);
      else console.log("Links fetched from the DB.");
    });

    console.log(" No. of links - " + links.length);

    // get the resume count 
    let resumeCount = 0;
    try{
    await CompanyModel.find({})
    .sort({r_c: -1})
    .limit(1)
    .then((doc) => {
        if(doc.length > 0){
            resumeCount = doc[0].r_c;
        }
    });
    }catch(err){
        console.log('Err in finding the resume count : ' + err);
    } 

    console.log('Resuming from index: ' + resumeCount);

    for (let i = resumeCount; i < links.length; i++) {
      // go to the target url
      await page.goto(links[i].link, {
        waitUntil: "networkidle0",
      });

      // random wait
      await page.waitFor(randomnessGenerator() * 5000);

      // sets slug
      const url = page.url();
      let slug = "";
      const urlArr = url.split("/");
      if (url.charAt(url.length - 1) === "/") {
        slug = urlArr[urlArr.length - 2];
      } else {
        slug = urlArr[urlArr.length - 1];
      }

      // check if company exists
      if(! await CompanyModel.exists({slug: slug})){   
      // if company doesnt exist  

      // expand fundings
      try {
        await page.evaluate(() =>
          document.querySelector(".fundings-load-more-btn").click()
        );
      } catch (err) {
        console.log("Fundings cant expand");
      }

      //check if the link is valid 
        try{
            await page.evaluate(() => document.querySelector(".startup-name").innerText);
        }catch(err){
            // jump to the next iteration
            console.log('Invalid page');
            continue;
        }

      // collect data
      const companyData = await page.evaluate(() => {
        return {
          name: document.querySelector(".startup-name").innerText,
          pitch: document.querySelector(".startup-short-description").innerText,
          logo_img: document.querySelector(".startup-logo").src,
          about: document.querySelector(".startup-description").textContent,
          date_founded: document
            .querySelector(".date-founded-wrapper")
            .querySelector("p").innerText,
          website: document.querySelector(".startup-website")
            ? document.querySelector(".startup-website").href
            : null,
          social_links:[
              ...document
                .querySelector(".website-wrapper")
                .querySelectorAll("a"),
            ].slice(1).length > 0
              ? [
                  ...document
                    .querySelector(".website-wrapper")
                    .querySelectorAll("a"),
                ]
                  .slice(1)
                  .map((cur) => cur.href)
              : null,
          location: document.querySelector(".startup-startup_location")
            .innerText,
          industry_tags:[
              ...document
                .querySelector(".vertical-wrapper")
                .querySelectorAll("a"),
            ].length > 0
              ? [
                  ...document
                    .querySelector(".vertical-wrapper")
                    .querySelectorAll("a"),
                ].map((cur) => cur.innerText)
              : null,
          funding:[...document.querySelectorAll(".funding-active")].length > 0
              ? [...document.querySelectorAll(".funding-active")].map((cur) => {
                  return {
                    round: cur.querySelector(".round").innerText,
                    amount: cur.querySelector(".amount").innerText,
                    date: cur.querySelector(".date").innerText,
                  };
                })
              : null,
        };
      });

      // creating a document
      const newCompany = new CompanyModel({
          ...companyData,
          slug: slug,
          r_c: i
        });

      // saving the document to the DB
      await newCompany.save((err) => {
          if(err){
              console.log('Error in saving company to DB : ' + err);
          }else{
              console.log('New company saved!');
          }
      });
      
      // random wait
      await page.waitFor(randomnessGenerator() * 1000 + 3000);  
      
    }else{
        // if company already exists
        console.log('Company Exists in the DB');
    }
    }

    // send success message
    await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
        to: `whatsapp:${process.env.MY_PHONE_NUM}`,
        body: `SUCCESSFULLY COLLECTED ALL E27 COMPANIES !!! ✔✔✨`,
      });
      
      console.log("Message sent");
      
      await browser.close();

  } catch (err) {
     // if the same error persists for 3 tries end the program and send message
      if(errCount < 4){
      console.log('Error in data scraper: ' + err );
      console.log('resuming....');
      await dataScraper();
      }else{
        const url = page.url();   
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_PHONE_NUM}`,
          to: `whatsapp:${process.env.MY_PHONE_NUM}`,
          body: `🐞🐞 BUG IN THE E27 APPLICATION AT URL \n ${url} \n ${err}`,
        });
        console.log("Message sent");
        await browser.close();
        throw '';
      }
  }
};

exports.dataScraper = dataScraper;
