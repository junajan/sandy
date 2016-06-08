var moment = require("moment");
var request = require("request");
var _ = require("lodash");
var csv = require("fast-csv");


var LogMockup = {};
["fatal", "error", "info", "notice", "debug"].forEach(function (level) {
    // "["+moment().format("DD.MM.YYYY HH:II:SS")+"]
    LogMockup[level] = console.log.bind(console, "MockupAPI("+level+"):");
});

var YahooApi = require("./_yahoo");


var Mock = function(config, app) {
    var self = this;
    var streaming = false;
    var DB = app.DB;
    Log = app.Log || LogMockup;

    // realtime data mockup URL
    var realtimeUrl = 'http://download.finance.yahoo.com/d/quotes.csv?f=sl1&s=';

    Log.info("Starting mockup API with config:", config);

    /**
     * Trasnform data from array to object
     * @param data Array of pairs [ticker, price]
     * @return Object {ticker: price, ...}
     */
    var transformPriceData = function (data) {
        var out = {};

        _.forEach(data, function(price, ticker) {
            out[ticker] = {
               price: price,
               origin: "yahoo",
               yahooPrice: price
            };
        });

        return out;
    };

    /**
     * Return info about streaming process
     * @returns {boolean} Is streaming turned on
     */
    self.isStreaming = function() {
        return streaming;
    };

    /**
     * Turn on streaming for given tickers
     * @param tickers Array list of ticker
     * @param done
     */
    self.startStreaming = function(tickers, done) {
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
    self.stopStreaming = function(done) {
        Log.debug("Stop streaming");
        streaming = false;
    };

    /**
     * Get prices for given tickers (if they are streamed)
     * @param tickers List of tickers to load
     * @param done Function(err, {ticker: price, ...}
     */
    self.getMarketPriceBulk = function (tickers, done) {
        YahooApi.getPrices(tickers, function (err, prices) {
            if(err) done(err);
            done(err, transformPriceData(prices));
        });
    };
    
    self.getPositions = function (done) {
        DB.getData("*", "positions", "close_date IS NULL", done);
    };

    self.getOrders = function (done) {
        return [];
    };
    
    return this;
};

var i = null;
module.exports = function(config, app) {

    return (i ? i : i = new Mock(config, app));
};

