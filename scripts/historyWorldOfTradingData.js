'use strict';

/**
 * This will download data from WorldOfTradingData.com API.
 */
require('colors');
const moment = require('moment');

const config = require('../config');
const WorldOfTradingData = require('../modules/Loader/WorldOfTradingData');

const DATE_FORMAT = 'YYYY-MM-DD';

const tickers = 'AAPL,LMT,KO,V'.split(',');
const dateTo = moment(new Date()).format(DATE_FORMAT);
const dateFrom = moment(dateTo).subtract(2, 'day').format(DATE_FORMAT);

WorldOfTradingData.init(config.worldOfTradingData);

(async () => {
  console.log(
    'Downloading data for "%s" tickers from "%s" to "%s"',
    tickers, dateFrom, dateTo,
  );

  const data = await WorldOfTradingData.historicalMany(tickers, dateFrom, dateTo);
  console.log('Fetched data:\n', data);
})();
