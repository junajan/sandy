const _ = require('lodash');
const axios = require("axios");
const Promise = require('bluebird');

const { RuntimeError, ConfigurationError } = require('../Core/Error');

const CONCURRENCY = 10;
const HISTORICAL_DATA_API_URL = 'https://api.worldtradingdata.com/api/v1/history?symbol=%ticker%&sort=newest&date_from=%dateFrom%&date_to=%dateTo%&api_token=%token%';
const REALTIME_DATA_API_URL = 'https://api.worldtradingdata.com/api/v1/stock?symbol=%ticker%&api_token=%token%';

const ERROR_MESSAGE_REACHED_LIMIT = 'You have reached your request limit for the day. Upgrade to get more daily requests.';

const loader = module.exports = {};

loader.config = null;
loader.tokenIndex = 0;

/**
 * Get API token with round robin scheduler.
 *
 * @private
 */
loader._getToken = () => {
  if (!loader.config) {
    throw new ConfigurationError('WorldOfTradingData::Module was not initialized!');
  }

  const {tokens} = loader.config;

  if (!tokens.length) {
    throw new RuntimeError('WorldOfTradingData::No tokens awailable!');
  }

  const token = tokens[loader.tokenIndex++ % tokens.length];
  return token;
};

/**
 * Assemble URL for historical data.
 *
 * @private
 */
loader._assembleUrl = (urlObject) => {
  const assembledUrl = urlObject.url
    .replace('%ticker%', urlObject.ticker)
    .replace('%dateFrom%', urlObject.dateFrom)
    .replace('%dateTo%', urlObject.dateTo)
    .replace('%token%', urlObject.token);

  return assembledUrl;
};

/**
 * Assemble URL object.
 *
 * @private
 */
loader._assembleUrlObject = (url, ticker, dateFrom = null, dateTo = null) => {
  const token = loader._getToken();

  return {
    url, ticker, dateFrom, dateTo, token,
  }
};
/**
 * Remove token from token list for 24 hours.
 *
 * @private
 */
loader._handleExhaustedToken = (removedToken) => {
  const index = loader.config.tokens.indexOf(removedToken);

  if (index === -1) {
    return;
  }

  console.error('WorldOfTradingData::Suspending token for 12 hours.');

  loader.config.tokens.splice(index, 1);

  setTimeout(() => {
    loader.config.tokens.push(removedToken);
  }, 1000 * 60 * 60 * 12);
};

/**
 * Call API with retry mechanism.
 *
 * @private
 */
loader._callApi = async (urlObject) => {
  const url = loader._assembleUrl(urlObject);

  const response = await axios.get(url);
  const data = response.data;

  if (data.message && data.message.includes(ERROR_MESSAGE_REACHED_LIMIT)) {
    console.error('WorldOfTradingData::Request limit reached for token - retrying.');

    loader._handleExhaustedToken(urlObject.token);
    urlObject.token = loader._getToken();

    return loader._callApi(urlObject);
  }

  return data;
};

/**
 * Init WorldOfTradingData module.
 *
 * @returns {Promise.<void>}
 */
loader.init = (initConfig) => {
  if (!initConfig || !initConfig.tokens || initConfig.tokens.length === 0) {
    throw new ConfigurationError('WorldOfTradingData::Missing tokens definition!');
  }

  loader.config = initConfig;
};

/**
 * Download data for one ticker.
 */
loader.historical = async (ticker, dateFrom, dateTo) => {
  const urlObject = loader._assembleUrlObject(HISTORICAL_DATA_API_URL, ticker, dateFrom, dateTo);

  const response = await loader._callApi(urlObject);

  if (!response.history) {
    throw new RuntimeError('WorldOfTradingData::Error while fetching historical data!', {
      ticker,
      dateFrom,
      dateTo,
      response,
    });
  }

  const serialized = Object
    .entries(response.history)
    .map(([date, record]) => ({
      date,
      open: Number(record.open),
      high: Number(record.high),
      low: Number(record.low),
      close: Number(record.close),
      adjClose: Number(record.close),
      volume: Number(record.volume),
      symbol: ticker,
      ticker,
    }));

  return serialized;
};

/**
 * Download data for many tickers.
 */
loader.historicalMany = async (tickers, dateFrom, dateTo) => {
  const data = await Promise.map(tickers, async (ticker) => {
    let tickerData = [];
    try {
      tickerData = await loader.historical(ticker, dateFrom, dateTo);
    } catch (e) {
      console.error('WorldOfTradingData::Error when downloading historical data for "%s" ticker', ticker, e);
    }

    return tickerData;
  }, {concurrency: CONCURRENCY});

  const serialized = tickers.reduce((all, ticker, index) => ({
    ...all,
    [ticker]: data[index],
  }), {});

  return serialized;
};

loader.realtime = async (ticker) => {
  const urlObject = loader._assembleUrlObject(REALTIME_DATA_API_URL, ticker);

  const response = await loader._callApi(urlObject);

  if (!response.data || !response.data[0] || !response.data[0].price) {
    throw new RuntimeError('WorldOfTradingData::Error while fetching realtime data!', {
      ticker,
      response,
    });
  }

  return Number(response.data[0].price);
};

loader.realtimePrices = async (tickers) => {
  const prices = {};

  await Promise.map(tickers, async (ticker) => {
    try {
      const price = await loader.realtime(ticker);
      prices[ticker] = price;
    } catch (e) {
      console.error('WorldOfTradingData::Error when downloading realtime data for "%s" ticker', ticker, e);
    }
  }, {concurrency: CONCURRENCY});

  return prices;
};
