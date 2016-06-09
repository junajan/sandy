var moment = require("moment");
var async = require("async");
var _ = require("lodash");

var OrderManager = function(app) {
    var self = this;
    var config = app.config;
    var DB = app.DB;

    var Broker = require(config.dirConnector+config.connector.driver)(config.connector.config, app);

    // ===== Attributes
    self.T_MKT = -1;


    self.savePrices = function(prices, done) {
        var data = [];

        _.forEach(prices, function(info, ticker) {
            data.push([ticker, info.price, info.origin, info.yahooPrice, JSON.stringify(info)]);
        });

        console.log("Saving actual prices for "+ data.length+ " tickers");
        DB.insertValues('stock_actual (symbol, price, origin, yahoo_price, data) ', data, function(err, res) {
            if(err) console.error(err);
            done(err, res);
        });
    };

    // ===== Functions
    self.startStreaming = function(tickers, done) {
        Broker.startStreaming(tickers, done);
    };

    self.stopStreaming = function(done) {
        Broker.stopStreaming(done);
    };
    
    self.getMarketPrice = function(ticker, done) {
        Broker.getMarketPriceBulk([ticker], function (err, data) {
            if(err) return done(err);

            done(err, data[ticker]);
        });
    };

    self.getMarketPriceBulk = function(tickers, done) {
        Broker.getMarketPriceBulk(tickers, function (err, prices) {
            if(! err)
                self.savePrices(prices, _.noop);
            done(err, prices);
        });
    };

    self.getPositions = function (done) {
        Broker.getPositions(done);
    };

    self.getOrders = function (done) {
        Broker.getOrders(done);
    };

    self.printPositions = function () {
        self.getPositions(function (err, positions) {
            if(err)
                return console.error("Opened Orders returned ERROR:".red, err);
            console.log("Opened position:".yellow);
            positions.forEach(function(item) {
                console.log(JSON.stringify(item));
            });
            if(!positions.length) console.log("-- empty --");
        });
    };

    self.printOrders = function () {
        self.getOrders(function (err, orders) {
            if(err)
                return console.error("Positions returned ERROR:".red, err);
            console.log("Opened orders:".yellow);
            console.dir(orders);
            orders.forEach(function(item) {
                console.log(JSON.stringify(item));
            });
            if(!orders.length) console.log("-- empty --");
        });
    };

    self.sendOrder = function (type, ticker, amount, price, requestedPrice, doneFilled) {
        Broker.sendOrder(type, ticker, amount, price, requestedPrice, doneFilled);
    };

    self.sendSellOrder = function (ticker, amount, price, requestedPrice, doneFilled) {
        Broker.sendOrder("SELL", ticker, amount, price, requestedPrice, doneFilled);
    };

    self.sendBuyOrder = function (ticker, amount, price, requestedPrice, doneFilled) {
        Broker.sendOrder("BUY", ticker, amount, price, requestedPrice, doneFilled);
    };

    return this;
};

var i = null;
module.exports = function(app) {
    return (i ? i : i = new OrderManager(app));
};

