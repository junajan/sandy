"use strict";

require('colors');
var _ = require('lodash');
var events = require('events');
var log4js = require('log4js');
// load configuration
var app = new events();

app.config = require("../config");
app.logger = app.config.logger;

app.DB = require(app.config.dirCore+'Mysql')(app.config.mysql);
app.getLogger = log4js.getLogger;

// var tickers = "AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
// tickers = ["UPRO"];

app.on("API.ready", function () {

    var tickers = "AAPL,CSCO,MSFT,INTC".split(",");
    // var tickers = "MSFT".split(",");
    console.log("Loading prices for", tickers.length, "tickers");
    Broker.startStreaming(tickers, function () {
        console.log("Streaming started.");
    });

    setTimeout(function() {
        Broker.getMarketPriceBulk(tickers, function (err, prices) {
            if(err) console.error("ERROR while loading prices", err);
            Broker.stopStreaming(_.noop);

            console.log("=== Prices ===");
            _.each(prices, function (info, ticker) {
                console.log(ticker,"|", info.price,"|",info.origin);
            });
        });
    }, 120000);

    // console.log("BUY");
    // Broker.sendBuyOrder("AAPL", 20, "MKT" , null, console.log.bind(this, "ORDER RESULT".rainbow));
    // // setTimeout(function() {
    //
    // Broker.sendBuyOrder("AAPL", 20, "MKT" , null, console.log.bind(this, "ORDER RESULT".rainbow));
    // Broker.sendBuyOrder("AAPL", 20, "MKT" , null, console.log.bind(this, "ORDER RESULT".rainbow));
    // Broker.sendBuyOrder("AAPL", 20, "MKT" , null, console.log.bind(this, "ORDER RESULT".rainbow));
    // Broker.sendBuyOrder("AAPL", 20, "MKT" , null, console.log.bind(this, "ORDER RESULT".rainbow));
    // }, 1000);
    // Broker.sendSellOrder("ALL", 14, "MKT" , 123, function (err, res) {
    //     console.log("======== RESULT ==========");
    //     console.log(err, res);
    // });
    // Broker.printOrders();

});
var config = app.config;
// var IB = require(config.dirConnector+config.connector.driver)(config.connector.config, app);
var Broker = require(app.config.dirCore+"OrderManager")(app);
