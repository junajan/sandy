require('colors');
const config = require('../config');
const Mock = require('../modules/Connector/Mock');
const DB = require(config.dirCore+'Mysql')(config.mysql);

const app = {
  config,
  DB,
  emit: () => {},
  logger: config.logger,
  memLogger: config.memLogger,
};


const tickers = ['AAPL', 'KO'];
const fromDate = '2019-11-07';
const barCount = 5;

const MockApi = new Mock(config, app);

(async () => {
  const data = await MockApi.getDailyHistoryMultiple(tickers, fromDate, barCount);

  console.log('Final:', data);
})();
