var request = require("request");
var _ = require("lodash");
var csv = require("fast-csv");

var Yahoo = function() {
    var self = this;

    // realtime data mockup URL
    var realtimeUrl = 'http://download.finance.yahoo.com/d/quotes.csv?f=sl1&s=';

    /**
     * Trasnform data from array to object
     * @param data Array of pairs [ticker, price]
     * @return Object {ticker: price, ...}
     */
    var transformPriceData = function (data) {
        var out = {};
        data.forEach(function(item) {
            out[item[0]] = item[1];
        });

        return out;
    };

    /**
     * Get prices for given tickers (if they are streamed)
     * @param tickers List of tickers to load
     * @param done Function(err, {ticker: price, ...}
     */
    self.getPrices = function (tickers, done) {
        if(_.isArray(tickers))
            tickers = tickers.join(',');

        console.log("Load market prices for these tickers", tickers);
        request(realtimeUrl+tickers, function (error, response, body) {
            if(error || response.statusCode !== 200)
                return done(error || {statusCode: response.statusCode});

            var buffer = [];
            csv.fromString(body)
                .on("data", function(data) {
                    buffer.push(data);
                })
                .once("error", done)
                .on("end", function() {
                    done(null, transformPriceData(buffer));
                });
        });
    };

    return this;
};

var i = null;
module.exports = function() {
    return (i ? i : i = new Yahoo());
}();

