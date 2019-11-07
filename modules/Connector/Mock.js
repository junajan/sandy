const _ = require("lodash");
const moment = require("moment");

const WorldOfTradingData = require("../Loader/WorldOfTradingData");

const HEARTHBEAT_INTERVAL = 1000;
const DATE_FORMAT = 'YYYY-MM-DD';

const LogMockup = {};
["fatal", "error", "info", "notice", "debug"].forEach(function (level) {
  LogMockup[level] = console.log.bind(console, "MockupAPI(" + level + "):");
});


const Mock = function (config, app) {
  var self = this;
  var streaming = false;
  var DB = app.DB;
  var orderId = 1;

  app.apiConnection = {
    ib: true,
    api: true
  };

  Log = app.Log || LogMockup;

  // Init secondary API for historical data
  WorldOfTradingData.init(config);

  Log.info('Starting MockAPI');

  var getNextOrderId = function () {
    return orderId++;
  };

  /**
   * Trasnform data from array to object
   * @param data Array of pairs [ticker, price]
   * @return Object {ticker: price, ...}
   */
  const transformPriceData = function (data) {
    const out = {};

    for(const [ticker, price] of Object.entries(data)) {
      out[ticker] = {
        price,
        origin: "WorldOfTradingData",
        yahooPrice: price,
      };
    }

    return out;
  };

  /**
   * Return info about streaming process
   * @returns {boolean} Is streaming turned on
   */
  self.isStreaming = function () {
    return streaming;
  };

  /**
   * Turn on streaming for given tickers
   * @param tickers Array list of ticker
   * @param done
   */
  self.startStreaming = function (tickers, done) {
    Log.debug("Start streaming these tickers:", tickers.join(","));
    streaming = true;

    setTimeout(function () {
      done(null, null);
    }, 0);
  };

  /**
   * Stop tickers data streaming
   * @param done
   */
  self.stopStreaming = function (done) {
    Log.debug("Stop streaming");
    streaming = false;
    done(null, null);
  };

  /**
   * Get prices for given tickers (if they are streamed)
   * @param tickers List of tickers to load
   * @param done Function(err, {ticker: price, ...}
   */
  self.getMarketPriceBulk = async function (tickers, done) {
    let data = null;
    try {
      data = await WorldOfTradingData.realtimePrices(tickers);
    } catch (err) {
      return done(err);
    }
    done(null, transformPriceData(data));
  };

  self.getPositions = function (done) {
    DB.getData("*", "positions", "close_date IS NULL", done);
  };

  self.getOrders = function (done) {
    return [];
  };

  self.sendOrder = function (type, ticker, amount, price, instrument, requestedPrice, doneFilled) {
    doneFilled(null, {
      orderId: getNextOrderId(),
      status: "Filled",
      instrument: instrument,
      ticker: ticker,
      type: type,
      amount: amount,
      price: requestedPrice,
      priceType: (price === "MKT") ? "MKT" : "LIMIT"
    });
  };

  self.watchConnection = function () {
    setInterval(function () {
      app.emit("API.time", moment().format("X"));
      app.emit("API.connection", app.apiConnection);
    }, HEARTHBEAT_INTERVAL);
  };

  self.disconnect = function () {
    return null;
  }

  self.getDailyHistoryMultiple = async (tickers, dateEnd, barsCount) => {
    const daysInPast = barsCount / 5 * 7;
    const dateFrom = moment(dateEnd).subtract(daysInPast, 'day').format(DATE_FORMAT);
    const dateTo = moment(dateEnd).format(DATE_FORMAT);

    Log.debug(`Downloading data for ${tickers} from ${dateFrom} till ${dateTo}`);

    const data = await WorldOfTradingData.historicalMany(tickers, dateFrom, dateTo);
    return data;
  };

  app.emit("API.connection", app.apiConnection);
  setTimeout(() => app.emit("API.ready"), 100)
  self.watchConnection();

  return this;
};

var i = null;
module.exports = function (config, app) {
  return (i ? i : i = new Mock(config, app));
};

