require('dotenv').config();
const mongoose = require("mongoose");
const { urlScraper } = require("./urlScraper");

(async () => {
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

  await urlScraper();

  mongoose.disconnect(() => {
    console.log("Disconnected from the DB");
  });
})();
