"use strict";

var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var stockPrices = require('../Loader/HistYahoo')

var SplitCheck = function(app) {
  var self = this;
  var DB = app.DB;
  var Log = app.getLogger("SplitCheck");

  var config = _.defaults(app.config);
  var Yahoo = require(config.dirLoader+'./HistYahoo');

  var _MIN_DIFF = config.splitCheckerMinDiff || 5;
  var _CONCURRENCY = 5;
  var _DB_TABLE = "stock_actual";

  this.calculateDiff = function (item) {
    item.diff = item.actualPrice - item.price;
    item.diffPercent = Math.abs(Number(item.diff / item.price * 100).toFixed(2));
    return item
  }

  this.splitCheck = function (config, done) {
    return self.getLatestClose()
      .then(function(data) {
        return self.enrichWithActualPrices(data);
      })
      .then(function(data) {
        const stocks = self.getValidThresholds(data);
        // if there are any stocks with price change above diff
        if(stocks.length)
          self.printValidStocks(stocks);
        done(null, stocks)
      })
      .catch(done)
  }

  this.printValidStocks = function(stocks) {
    Log.warn('Stock(s) crossed splitChecker min threshold %d%', _MIN_DIFF)
    stocks.forEach(function (stock) {
      Log.warn('Stock: %s | actual price: %s(%s) | old price: %s(%s) | diffPercent: %d%',
        stock.ticker,
        stock.actualPrice,
        stock.actualDate,
        stock.price,
        stock.date,
        stock.diffPercent
      )
    })
  }

  this.getValidThresholds = function (data) {
    return _.filter(data, 'treshold')
  }

  this.enrichWithActualPrices = function (data) {
    return Promise.map(data, function (item) {
      return self.getActualPrice(item.ticker)
        .then(function (price) {
          item.actualPrice = price;
          item.actualDate = moment().format('YYYY-MM-DD');
          item = self.calculateDiff(item);

          item.treshold = item.diff > _MIN_DIFF;
          return item
        })
    }, { concurrency: _CONCURRENCY });
  }

  this.getActualPrice = function (ticker) {
    return new Promise(function (resolve, reject) {
      stockPrices.actual(ticker, function (err, res) {
        if(err) return reject(err);
        resolve(res[0][1])
      })
    })
  }

  this.getLatestClose = function () {
    return new Promise(function (resolve, reject) {
      DB.getData(
        'DATE_FORMAT(date, "%Y-%m-%d") as date, symbol as ticker, price, yahoo_price, origin',
        _DB_TABLE,
        // TODO remove LIMIT 5
        'date = (SELECT MAX(date) FROM '+_DB_TABLE+' LIMIT 1) LIMIT 5', function (err, res) {
          if(err) return reject(err)
          resolve(res)
        })
    })
  }

  return this;
};



module.exports = function(app) {
  return new SplitCheck(app);
};