'use strict';

require('colors');
var _ = require('lodash');
var util = require('util');
var ibApi = require("ib");
var events = require('events');
var moment = require("moment");
var YahooApi = require("./_yahoo");
var once = require('once');

var LogMockup = {};
["fatal", "error", "info", "notice"].forEach(function (level) {
    // "["+moment().format("DD.MM.YYYY HH:II:SS")+"]
    LogMockup[level] = console.log.bind(console, "MockupAPI("+level+"):");
});

LogMockup["debug"] = LogMockup["trace"] = _.noop;

var eventEmitter = new events();

var IBApi = function(config, app) {
    var self = this;
    var streaming = false;
    var orderId = 0;
    var streamingIdMap = {};

    var streamingPrices = {};
    var streamingPositions = false;
    var loadingOrders = false;
    var streamingOrders = [];
    var placedOrders = {};

    var Log = app.Log || LogMockup;
    var DB = app.DB;

    Log.info("Starting IB API with config:", config);
    
    var sendToDebug = function () {
        Log.debug.apply(Log.debug, arguments);
    };

    var ib = new (ibApi)(config)
        .on('error', function (err) {
            if(arguments[1] && arguments[1].id && streamingIdMap[arguments[1].id])
                console.log("ERROR Ticker:", streamingIdMap[arguments[1].id].ticker, err);
            else if(err && err.code) {
                console.error("ERROR: cannot connect to IB api.. exiting".red, err);
                process.exit(1);
            } else
                console.log("ERROR: ".red, err);
        }).on('result', function (event, args) {
            if (!_.includes(['nextValidId', 'execDetails', 'orderStatus', 'openOrderEnd', 'openOrder', 'positionEnd', 'position', 'tickEFP', 'tickGeneric', 'tickOptionComputation', 'tickPrice',
                    'tickSize', 'tickString'], event)) {
                console.log('Result: %s %s', (event + ':').yellow, JSON.stringify(args));
            }
        }).once('nextValidId', function (id) {

            console.log('First valid ID is'.yellow, id);
            orderId = id;

            if(_.isFunction(app.emit))
                app.emit("ibReady");

            // ib.placeOrder(getNextOrderId(), ib.contract.stock('AAPL'), ib.order.market('BUY', 100));
            // ib.placeOrder(orderId + 1, ib.contract.stock('GOOG'), ib.order.limit('SELL', 1, 9999));
            // ib.placeOrder(orderId + 2, ib.contract.stock('FB'), ib.order.limit('BUY', 1, 0.01));

            // self.sendOrder("BUY", "AAPL", 50, "MKT", console.log.bind(null, "DONE SENT:"), console.log.bind(null, "DONE FILLED:"));
        }).on('tickEFP', sendToDebug)
        .on('tickGeneric', sendToDebug)
        .on('tickOptionComputation', sendToDebug)
        .on('tickSize', sendToDebug)
        .on('tickString', sendToDebug)
        .on('tickPrice', function (tickerId, tickType, price, canAutoExecute) {

            if(!streamingIdMap[tickerId]) {
                console.error("ERROR - something went really wrong - tickPrice event for unknown tickerId - ".red, arguments);
                return false;
            }

            var tickType = ib.util.tickTypeToString(tickType);
            var ticker = streamingIdMap[tickerId].ticker;
            var price = Number(price);
            streamingPrices[ticker][tickType] = price;
            streamingPrices[ticker].lastdate = new Date();

            // "ASK", "BID",
            if(price > 0 && [ "LAST", "CLOSE"].indexOf(tickType) >= 0) {

                streamingPrices[ticker].lastPriceType = tickType;
                streamingPrices[ticker].lastPrice = price;
            }

            console.log(
                'IB API STREAMING: %s %s %s%d %s%s',
                util.format('[%s]', tickType).cyan,
                ticker.yellow+"("+streamingIdMap[tickerId].type+")",
                'price='.bold, price,
                'canAutoExecute='.bold, canAutoExecute
            );
        }).on('position', function (account, contract, pos, avgCost) {
            streamingPositions.push({
                account: account,
                contract: contract,
                position: pos,
                avgCost: avgCost
            });
        }).on('positionEnd', function () {
            eventEmitter.emit("positions", null, streamingPositions);
            streamingPositions = false;
        }).on('openOrder', function (orderId, contract, order, orderState) {
            console.log(
                '%s %s%d %s%s %s%s %s%s',
                '[openOrder]'.cyan,
                'orderId='.bold, orderId,
                'contract='.bold, JSON.stringify(contract),
                'order='.bold, JSON.stringify(order),
                'orderState='.bold, JSON.stringify(orderState)
            );

            streamingOrders.push({
                orderId: orderId,
                contract: contract,
                order: order,
                orderState: orderState
            });

        }).on('openOrderEnd', function () {
            eventEmitter.emit("orders", null, streamingOrders);
            loadingOrders = false;
            streamingOrders = [];

        }).on('orderStatus', function (id, status, filled, remaining, avgFillPrice, permId,
                                       parentId, lastFillPrice, clientId, whyHeld) {
            console.log(
                '%s %s%d %s%s %s%d %s%d %s%d %s%d %s%d %s%d %s%d %s%s',
                '[orderStatus]'.cyan,
                'id='.bold, id,
                'status='.bold, status,
                'filled='.bold, filled,
                'remaining='.bold, remaining,
                'avgFillPrice='.bold, avgFillPrice,
                'permId='.bold, permId,
                'parentId='.bold, parentId,
                'lastFillPrice='.bold, lastFillPrice,
                'clientId='.bold, clientId,
                'whyHeld='.bold, whyHeld
            );

            if(!placedOrders[id]) {
                return console.error("Order id %d was not found in placed orders".red, id);
            }


            if(status === "Filled") {
                var info = placedOrders[id];

                info.doneFilled(null, {
                    orderId: id,
                    status: status,
                    ticker: info.ticker,
                    type: info.type,
                    amount: filled,
                    price: avgFillPrice,
                    priceType: info.priceType,
                });
                clearTimeout(placedOrders[id].timeoutId);
            }

        }).on('execDetails', function (reqId, contract, exec) {
            console.log(arguments);
            console.log("ExecDetails".cyan, "reqId:;".bold, reqId, "contract:".bold, contract, "exec:".bold, exec );

            self.logOrder(exec.orderId, contract.symbol, exec.side, exec.shares, exec.price, "PROCESSED", JSON.stringify(arguments), function (err, res) {
                if(err) log.error("There was an error while saving execDetails".red, arguments);


            })
        });

    var getNextOrderId = function () {
        return orderId++;
    };

    /**
     * Function will change MSFT, CSCO and INTC market to ISLAND
     * and BRK-B to BRK B
     */
    var serializeTicker = function (ticker, market) {
        if(["MSFT", "CSCO", "INTC"].indexOf(ticker) >= 0)
            return {ticker: ticker, market: "ISLAND"};

        ticker = ticker.replace("-", " ");
        return {ticker: ticker, market: market};
    };

    var streamTicker = function(type, ticker, market) {
        var id = getNextOrderId();
        var data = serializeTicker(ticker, market || null);

        streamingPrices[ticker] = {};

        Log.debug("Start watching", ticker, "with ID", id);
        ib.reqMktData(id, ib.contract[type](data.ticker, data.market), '', false);
        streamingIdMap[id] = {ticker: ticker, type: type};

        return id;
    };

    var pickBestPrices = function (tickers, streamingPrices) {
        var out = {};

        tickers.forEach(function(ticker) {
            var info = out[ticker] = streamingPrices[ticker];

            if(!info || info.unknown) {
                console.error(("ERROR: Ticker "+ ticker +" is not in the streaming list => removing").red);
                info.origin = "unknown";
                info.price = -1;

            } else if(info.lastPrice) {
                console.log("For "+ticker.yellow+" using IB API ", info.lastPriceType, "price", info.lastPrice);
                info.price = info.lastPrice;
                info.origin = "ib";

            } else {
                console.log(("WARNING For "+ticker.yellow+" using YahooAPI price "+ info.yahooPrice));
                info.price = info.yahooPrice;
                info.origin = "yahoo";

            }
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
        Log.debug("Start streaming these tickers:", tickers);
        streaming = true;

        tickers.forEach(function(item){
            streamTicker("stock", item);
        });

        setTimeout(function(){
            done(null, null);
        }, 1000);
    };

    /**
     * Turn on streaming for given forex currency pairs
     * @param tickers Array list of ticker
     * @param done
     */
    self.startStreamingForex = function(tickers) {
        Log.debug("Start streaming these tickers:", tickers);
        streaming = true;

        tickers.forEach(function(item){
            streamTicker("forex", item);
        });
    };

    /**
     * Stop tickers data streaming
     * @param done
     */
    self.stopStreaming = function(done) {
        Log.debug("Cancelling subscriptions to all tickers");
        streaming = false;

        Object.keys(streamingIdMap).forEach(function(id) {
            id = parseInt(id);
            ib.cancelMktData(id);
        });

        streamingPrices = {};
        streamingIdMap = {};
    };

    /**
     * Get prices for given tickers (if they are streamed)
     * @param tickers List of tickers to load
     * @param done Function(err, {ticker: price, ...}
     */
    self.getMarketPriceBulk = function (tickers, done) {
        if(!_.isArray(tickers))
            tickers = tickers.split(",");
        var tickersList = tickers.join(',');

        Log.debug("Load market prices for tickers:", tickersList);

        YahooApi.getPrices(tickers, function (err, res) {
            if(err) console.error("Error while loading tickers from yahoo", err, res);

            _.forEach(res, function (price, ticker) {
                if(!streamingPrices[ticker]) {
                    streamingPrices[ticker] = {
                        unknown: true
                    };
                }

                streamingPrices[ticker].yahooPrice = Number(price);
            });

            done(null, pickBestPrices(tickers, streamingPrices));
        });
    };

    self.getPositions = function (done) {
        console.log("GetPositions: Addming callback to event emitter");
        eventEmitter.once("positions", done);

        if(streamingPositions) return;
        streamingPositions = [];

        ib.reqPositions();
    };

    self.getOrders = function (done) {
        console.log("GetOrders: Addming callback to event emitter");
        eventEmitter.once("orders", done);

        if(loadingOrders) return;
        loadingOrders = true;

        ib.reqOpenOrders();
    };

    self.logOrder = function (orderId, ticker, type, amount, price, priceType, done) {
        DB.insert("api_log", {
            order_id: orderId,
            ticker: ticker,
            type: type,
            amount: amount,
            price: price,
            price_type: priceType
        }, done);
    };

    self.sendOrder = function (type, ticker, amount, price, requestedPrice, doneFilled) {
        var order, priceType;
        var orderId = getNextOrderId();

        doneFilled = once(doneFilled);

        if(["BUY", "SELL"].indexOf(type) == -1)
            throw "Undefined order type - "+type+" - allowed types are BUY or SELL";

        if(!_.isNumber(amount) || amount < 1)
            throw "Unsupported amount - must be positive number";

        if(price == "MKT")
            order = ib.order.market(type, amount);
        else
            order = ib.order.limit(type, amount, price);

        console.log(("SendOrder".yellow+ " Sending order(%d) %s(%s) %sx %s"), orderId, type, ticker, amount, price);
        priceType = (price === "MKT") ? "MKT" : "LIMIT";
        price = (price === "MKT") ? -1 : price;

        self.logOrder(orderId, ticker, type, amount, price, priceType, null, function (err, res) {

            if(err) {
                console.error("There was and error while saving order info to DB", err, res);
                return setTimeout(function(){
                    doneFilled(err);
                });
            }

            placedOrders[orderId] = {
                ticker: ticker,
                orderId: orderId,
                type: type,
                amount: amount,
                price: price,
                priceType: priceType,
                doneFilled: doneFilled
            };

            placedOrders[id].timeoutId = setTimeout(function () {
                placedOrders[id].doneFilled({
                    error: "timeout",
                    errorText: "There was triggered timeout for order ID "+orderId,
                    orderId: orderId,
                });
            });

            ib.placeOrder(orderId, ib.contract.stock(ticker), order);
        });
    };

    /**
     * Connect to IB API
     */
    ib.connect();

    return this;
};

var i = null;
module.exports = function(config, log) {
    return (i ? i : i = new IBApi(config, log));
};
