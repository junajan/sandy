var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require("request"));


function AlphaVantage(API_KEY) {
  var self = this;
	var URL = "https://www.alphavantage.co/query?apikey="+API_KEY+"&outputsize=compact&function=TIME_SERIES_INTRADAY&symbol=%%ticker%%&interval=60min"

  this.lastPrice = function(tickers, done) {
	  if (!_.isArray(tickers))
	    tickers = [tickers]
    tickers = _.uniq(tickers)

		return Promise.map(tickers, function(ticker) {
      var url = URL.replace('%%ticker%%', ticker)
      var conf = {
        url: url,
        json: true
      }
      var response = null

      return request.getAsync(conf)
        .delay(5000)
        .then(function (res) {
          var prices = res.body['Time Series (60min)']
          response = res
          var dates = Object.keys(prices)

          if(!dates.length)
            return null

          return { ticker: ticker, price: prices[dates[0]]['4. close'] }
        })
        .catch(function(err) {
          return null;

          console.error(
            `Error when downloading realtime prices for ${ticker}`,
            err, response.body
          )
        })

    }, { concurrency: 1 })
      .then(function(prices) {
        var res = {}

        prices.filter(Boolean)
          .map(function(val) {
            res[val.ticker] = val.price
          })

        done(null, res)
      })
      .catch(function (err) {
        done(err)
      })
  }

  return this;
}

module.exports = function (key) {
	return new AlphaVantage(key);
}
