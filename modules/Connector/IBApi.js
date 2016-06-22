'use strict';

require('colors');
var _ = require('lodash');
var util = require('util');
var ibApi = require("ib");
var events = require('events');
var moment = require("moment");
var YahooApi = require("./_yahoo");
var once = require('once');
// const throttle = require('throttle-function');
const throttle = require('../throttledFunction');

const ORDER_TIMEOUT = 30000;
const HEARTHBEAT_INTERVAL = 1000;

// IB API status codes
const IB_CONNECTION_RESTORED = 1102;
const IB_CONNECTION_IS_OK = 2106;
const IB_CONNECTION_IS_OK2 = 2104;
const IB_CONNECTION_LOST = 1100;
const IB_CONNECTION_BROKEN = 2103;
const IB_CONNECTION_BROKEN2 = 2110;
const IB_CONNECTING = 2119;
const IB_DATA_UPON_DEMAND = 2108;

const API_LIMIT_WINDOW = 1;
const API_LIMIT_REQUESTS = 40;

var apiMessages = {};
apiMessages[IB_CONNECTION_IS_OK] = "Data farm connection is OK.";
apiMessages[IB_CONNECTION_IS_OK2] = "Market data farm connection is OK:usfarm.us";
apiMessages[IB_DATA_UPON_DEMAND] = "Market data farm connection is inactive but should be available upon demand.usfarm.us";
apiMessages[IB_CONNECTING] = "Market data farm is connecting:usfarm.us";
apiMessages[IB_CONNECTION_LOST] = "Connectivity between IB and Trader Workstation has been lost.";
apiMessages[IB_CONNECTION_RESTORED] = "Connectivity between IB and Trader Workstation has been restored - data maintained.";
apiMessages[IB_CONNECTION_BROKEN] = "Market data farm connection is broken:usfarm";
apiMessages[IB_CONNECTION_BROKEN2] = "Connectivity between Trader Workstation and server is broken. It will be restored automatically.";

var apiInfos = [IB_CONNECTION_IS_OK2, IB_CONNECTION_IS_OK, IB_DATA_UPON_DEMAND, IB_CONNECTING, IB_CONNECTION_RESTORED];

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

    var Log = app.getLogger("IB-API");
    var DB = app.DB;

    app.apiConnection = {
        api: false,
        ib: false,
        marketData: false
    };

    Log.info("Starting IB API with config:", config);
    
    var ib = new (ibApi)(config)
        .on('error', function (err, data) {
            if(arguments[1] && arguments[1].id && streamingIdMap[arguments[1].id]) {

                Log.error("An error for ticker:", streamingIdMap[arguments[1].id].ticker, err);
            } else if(err && err.code == "ECONNREFUSED") {

                Log.error("ERROR: cannot connect to IB api ... exiting".red);
                setTimeout(function() {
                    Log.error("EXITING");
                    process.exit(1);
                }, 1000);
            } else if(err.toString() === "Error: Cannot send data when disconnected.") {
                Log.error("API is down ... exiting")
                process.exit(1);
            } else {

                if(_.isObject(data) && data.code && apiMessages[data.code]) {
                    if(apiInfos.indexOf(data.code) >= 0)
                        Log.info(apiMessages[data.code]);
                    else
                        Log.error(apiMessages[data.code], data);


                    if(app.apiConnection.marketData === false && [IB_CONNECTION_RESTORED].indexOf(data.code) >= 0) {
                        eventEmitter.emit("refreshStreaming");
                    }

                    if([IB_CONNECTION_IS_OK2, IB_CONNECTION_RESTORED, IB_CONNECTION_IS_OK, IB_DATA_UPON_DEMAND].indexOf(data.code) >= 0) {
                        app.apiConnection.ib = true;
                        app.apiConnection.marketData = true;
                    } else if([IB_CONNECTION_LOST, IB_CONNECTION_BROKEN, IB_CONNECTING, IB_CONNECTION_BROKEN2].indexOf(data.code) >= 0) {
                        app.apiConnection.ib = false;
                        app.apiConnection.marketData = false;
                    }

                    app.emit("API.connection", app.apiConnection);

                } else {
                    Log.error(err.toString(), data);
                }
            }

        }).on('result', function (event, args) {
            if (!_.includes(['currentTime', 'nextValidId', 'execDetails', 'orderStatus', 'openOrderEnd', 'openOrder', 'positionEnd', 'position', 'tickEFP', 'tickGeneric', 'tickOptionComputation', 'tickPrice',
                    'tickSize', 'tickString'], event)) {
                Log.debug('API Result:'.yellow +' %s %s', (event + ':').yellow, JSON.stringify(args));
            }
        }).on('currentTime', function (time) {
            Log.trace("Hearthbeat", time);
            app.emit("API.time", time);

        }).once('nextValidId', function (id) {

            Log.debug('First valid ID is'.yellow, id);
            orderId = id;

            if(_.isFunction(app.emit)) {
                app.apiConnection.api = true;
                app.apiConnection.ib = true;

                app.emit("API.ready");
                app.emit("API.connection", app.apiConnection);
            }
        }).on('tickPrice', function (tickerId, tickType, price, canAutoExecute) {

            if(!streamingIdMap[tickerId]) {
                Log.warn("Something went really wrong - tickPrice event for unknown tickerId - ".red, arguments);
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

            Log.debug(
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
            Log.debug(
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
            var info;
            Log.debug(
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
                return Log.error("Order id %d was not found in placed orders".red, id);
            }

            info = placedOrders[id];

            if(status === "Filled") {

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
            } else if(status === "Cancelled") {

                info.doneFilled({
                    error: "cancelled",
                    errorText: "There was triggered timeout for order ID "+id+" ticker "+info.ticker,
                    orderId: id,
                    ticker: info.ticker,
                });
            }

        }).on('execDetails', function (reqId, contract, exec) {
            Log.debug("ExecDetails".cyan, "reqId:;".bold, reqId, "contract:".bold, JSON.stringify(contract), "exec:".bold, JSON.stringify(exec));

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

    var streamTickerOrig = function(type, ticker, market) {
        var id = getNextOrderId();
        var data = serializeTicker(ticker, market || null);

        streamingPrices[ticker] = {};

        Log.debug("Start watching", ticker, "with ID", id);
        ib.reqMktData(id, ib.contract[type](data.ticker, data.market), '', false);
        streamingIdMap[id] = {ticker: ticker, type: type};

        return id;
    };

    const streamTicker = throttle(streamTickerOrig, {
        // max 40 requests per second
        window: API_LIMIT_WINDOW,
        limit: API_LIMIT_REQUESTS
    });
    streamTicker.events.on("throttled.emptyQueue", function() {
        console.log("==============".rainbow);
    })

    var pickBestPrices = function (tickers, streamingPrices) {
        var out = {};

        tickers.forEach(function(ticker) {
            var info = out[ticker] = streamingPrices[ticker];

            if(!info || info.unknown) {
                Log.error(("ERROR: Ticker "+ ticker +" is not in the streaming list => removing").red);
                info.origin = "unknown";
                info.price = -1;

            } else if(info.lastPrice) {
                Log.debug("For "+ticker.yellow+" using IB API ", info.lastPriceType, "price", info.lastPrice);
                info.price = info.lastPrice;
                info.origin = "ib";

            } else {
                Log.warn(("WARNING For "+ticker.yellow+" using YahooAPI price "+ info.yahooPrice));
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
        Log.info("Start streaming these tickers:", tickers.join(","));
        streaming = true;

        tickers.forEach(function(item){
            streamTicker("stock", item);
        });

        setTimeout(function(){
            done(null, null);
        }, 1000);
    };

    /**
     * Stop tickers data streaming
     * @param done
     */
    self.stopStreaming = function(done) {
        Log.info("Cancelling subscriptions to all tickers");
        streaming = false;

        Object.keys(streamingIdMap).forEach(function(id) {
            id = parseInt(id);
            ib.cancelMktData(id);
        });

        streamingPrices = {};
        streamingIdMap = {};
    };

    self.getStreamingTickers = function () {
        var list = [];
        _.forEach(streamingIdMap, function (item) {
            if(list.indexOf(item.ticker) < 0)
                list.push(item.ticker);
        });

        return list;
    };

    /**
     * Refresh tickers data streaming
     */
    self.refreshStreaming = function() {
        var tickers = self.getStreamingTickers();
        if(!tickers.length)
            return;

        Log.info("Refreshing subscriptions to all tickers");

        streaming = true;

        tickers.forEach(function(item){
            streamTicker("stock", item);
        });
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
            if(err) Log.error("Error while loading tickers from yahoo", err, res);

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
        Log.debug("GetPositions: Adding callback to event emitter");
        eventEmitter.once("positions", done);

        if(streamingPositions) return;
        streamingPositions = [];

        ib.reqPositions();
    };

    self.getOrders = function (done) {
        Log.debug("GetOrders: Adding callback to event emitter");
        eventEmitter.once("orders", done);

        if(loadingOrders) return;
        loadingOrders = true;

        ib.reqOpenOrders();
    };

    self.logOrder = function (orderId, ticker, type, amount, price, priceType, log, done) {
        DB.insert("api_log", {
            order_id: orderId,
            ticker: ticker,
            type: type,
            amount: amount,
            price: price,
            price_type: priceType,
            log: log
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

        Log.debug(("SendOrder"+ " Sending order(%d) %s(%s) %sx %s"), orderId, type, ticker, amount, price);
        priceType = (price === "MKT") ? "MKT" : "LIMIT";
        price = (price === "MKT") ? -1 : price;

        self.logOrder(orderId, ticker, type, amount, price, priceType, null, function (err, res) {
            if(err) {
                Log.error("There was and error while saving order info to DB", err, res);
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

            placedOrders[orderId].timeoutId = setTimeout(function () {
                Log.error("OrderId("+orderId+") is taking too long to process - cancelling");
                ib.cancelOrder(orderId);
            }, ORDER_TIMEOUT);

            ib.placeOrder(orderId, ib.contract.stock(ticker), order);
        });
    };

    self.watchConnection = function() {
        setInterval(function () {
            ib.reqCurrentTime();
        }, HEARTHBEAT_INTERVAL);
    }

    /**
     * Connect to IB API
     */
    ib.connect();
    self.watchConnection();

    eventEmitter.on("refreshStreaming", self.refreshStreaming);
    return this;
};

var i = null;
module.exports = function(config, log) {
    return (i ? i : i = new IBApi(config, log));
};
