var _ = require('lodash');
var path = require('path');

const _FULL_TABLE = "stock_history_full";

class StockHistory {
  constructor (app) {
    this.DB = app.DB;
    this.config = app.config;

    this.Connector = this.getConnector(this.config, app);
  }

  getConnector(config, app) {
    console.log("Using connector %s", config.connector.driver);
    const connectorPath = path.join(config.dirConnector, config.connector.driver);
    return require(connectorPath)(config, app);
  };

  getHistory(ticker, from, to, internal = false) {
    return internal
      ? this.DB.getData('*', _FULL_TABLE, 'ticker = ? AND date >= ? AND date <= ?', [ticker, from, to], 'date', 'ASC')
      : this.Connector.getHistory(ticker, from, to);
  };

  saveHistory(ticker, data) {
    return this.DB.insertMultiple(
      _FULL_TABLE+' (date, open, high, low, close, volume, adjClose, ticker)',
      this.serializeHistoricalData(ticker, data));
  };

  serializeHistoricalData(ticker, data) {
    return data.map((item) => [
      item.date,
      item.open,
      item.high,
      item.low,
      item.close,
      item.volume,
      item.adjClose,
      ticker
    ]);
  };
}

module.exports = function(app) {
  return new StockHistory(app);
};
