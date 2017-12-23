var _ = require("lodash");
var NasdaqFinance = require("nasdaq-finance").default;

var Yahoo = function() {
    var self = this;


    const client = new NasdaqFinance({
      tickerConcurrency: 3
    })

    /**
     * Get prices for given tickers (if they are streamed)
     * @param tickers List of tickers to load
     * @param done Function(err, {ticker: price, ...}
     */
    self.getPrices = function (tickers, done) {
        if(_.isString(tickers))
            tickers = tickers.split(',')

        console.log("Load market prices for these tickers", tickers.join(','));

        return client.getPrice(tickers, true)
          .then(prices => done(null, prices))
          .catch(err => done(err, null))
    };

    return this;
};

var i = null;
module.exports = function() {
    return (i ? i : i = new Yahoo());
}();

