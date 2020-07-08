require("dotenv").config();
const mongoose = require("mongoose");

const betaListScraper = require("./betaList");
const craftScraper = require("./craft");
const e27Scraper = require('./e27');
const tracxnScraper = require('./tracxn');
const vbProfileScraper = require('./vbProfiles');

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
    await betaListScraper();

    await waitFor(5000);

    // scraping craft
    await craftScraper();

    await waitFor(5000);

    // scraping e27 
    await e27Scraper();

    await waitFor(5000);

    // scraping tracxn
    await tracxnScraper();

    await waitFor(5000);

    // scraping vbProfiles
    await vbProfileScraper();

    await waitFor(10000);
  
  mongoose.disconnect(() => console.log("disconnected from the db"));
    
})();
