const { urlScraper } = require("./urlScraper");
const {dataScraper} = require('./dataScraper');

exports.yourStory = async () => {
  // await urlScraper();
  await dataScraper();
};
