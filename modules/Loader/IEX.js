var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require("request"));

function IEX() {
  var self = this;
  const realtime = "https://api.iextrading.com/1.0/stock/market/batch?types=price&symbols="
  const historical = "https://api.iextrading.com/1.0/stock/market/batch?types=chart&range=1y&symbols="

  this.serializeTickers = function (tickers) {
    return _.uniq(_.isArray(tickers) ? tickers : [tickers])
  }

  this.processRealtimePricesResponse = function (res) {
    const prices = {}
    Object.keys(res.body).forEach((key) => {
      if(res.body[key])
        prices[key] = res.body[key].price
    })

    return prices
  }

  this.realtimePrices = function(tickers, done) {
    tickers = self.serializeTickers(tickers)

    var conf = {
      url: realtime+tickers.join(','),
      json: true
    }

    return request.getAsync(conf)
      .catch(function(err) {
        console.error(
          `Error when downloading realtime prices for ${tickers} - retrying`,
          err
        )
        return request.getAsync(conf)
      })
      .then(self.processRealtimePricesResponse)
      .then(prices => done(null, prices))
      .catch(done)
  }

  this.historical = function (tickers, done) {
    tickers = self.serializeTickers(tickers)

    var conf = {
      url: historical+tickers.join(','),
      json: true
    }

    return request.getAsync(conf)
      .catch(function(err) {
        console.error(
          `Error when downloading realtime prices for ${tickers} - retrying`,
          err
        )
        return request.getAsync(conf)
      })
      .then(res => done(null, res.body))
      .catch(done)
  }

  return this;
}

module.exports = function (key) {
  return new IEX(key);
}