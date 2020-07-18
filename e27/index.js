const {urlScraper} = require('./urlScraper');
const {dataScraper} = require('./dataScraper');

module.exports = async () => {
  // await urlScraper();
  await dataScraper();
};
