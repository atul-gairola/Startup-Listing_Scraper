require("dotenv").config();
const mongoose = require("mongoose");

const betaListScraper = require("./betaList");
const craftScraper = require("./craft");
const e27Scraper = require('./e27');
const tracxnScraper = require('./tracxn');
const startupIndiaScraper = require('./startupIndia');
const vbProfileScraper = require('./vbProfiles');
const {yourStory} = require('./yourStory');

(async () => {
  // connecting to the remote database
  await mongoose
    .connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0-ymx8s.mongodb.net/Startup_Listing?retryWrites=true&w=majority`,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    )
    .then(() => console.log("Connected to the db"))
    .catch((err) => console.log(err));

    // scrapping betalist
    // await betaListScraper();

    // scraping craft
    // await craftScraper();

    // scraping e27 
    // await e27Scraper();

    // scraping startupIndia
    // await startupIndiaScraper();
    
    // scraping tracxn
    // await tracxnScraper();

    // scraping vbProfiles
    // await vbProfileScraper();

    //scraping yourStory
    await yourStory();
    
  mongoose.disconnect(() => console.log("disconnected from the db"));
    
})();
