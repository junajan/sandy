const _ = require('lodash');
Promise = require('bluebird');

const SecondaryService = require('../Connector/YahooMock');

class History {
  constructor (app) {
    this.app = app;
    this.logger = app.getLogger("HISTORY");
    this.config = app.config.connector.config;
    this.driver = app.config.connector.driver;

    const PrimaryService = require(app.config.dirConnector + this.driver);
    this.logger.info("Using primary history driver %s", this.driver);
    // connectors
    this.connectors = {
      secondary: SecondaryService(this.config, app),
      primary: PrimaryService(this.config, app)
    };
  }

  getIncompleteTickers(tickers, data, barCount) {
    return tickers
      .filter((ticker) => {
        const rows = data[ticker] || [];
        // if we have not enough data for this ticker
        if (rows && rows.length >= barCount)
          return false;

        this.logger.error(`Ticker ${ticker} does not have enough data length(${rows.length})`)
        return true;
      });
  }

  getHistoryMultiple (tickers, fromDate, barCount) {
    return this.connectors.primary.getDailyHistoryMultiple(tickers, fromDate, barCount)
      .catch((err) => {
        this.logger.error(`There was an error when downloading history from primary service`, err);
        return Promise.resolve({})
      })
      .then((data) => {
        // don't check data when we use yahoo mock for loading
        this.logger.debug('Doing a post load data check');
        const incompleteTickers = this.getIncompleteTickers(tickers, data, barCount);

        if(!incompleteTickers.length)
          return data;

        this.logger.error(`Ticker(s) ${incompleteTickers} do not have enough historical data and will be downloaded from a secondary source.`);
        return this.connectors.secondary.getDailyHistoryMultiple(incompleteTickers, fromDate, barCount)
          .catch((err) => {
            this.logger.error(`There was an error when completing history from secondary source`, err);
            return Promise.resolve({})
          })
          .then((dataSecondary) => {
            this.logger.info(`Merging data from a secondary source`);
            data = _.merge(data, dataSecondary);
            return data;
          })
      })
  }
}

module.exports = History;