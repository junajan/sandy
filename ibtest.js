"use strict";

require('colors');
var _ = require('lodash');
// load configuration
var app = {};
app.config = require("./config");
app.DB = require(app.config.dirCore+'Mysql')(app.config.mysql);

var Broker = require(app.config.dirCore+"OrderManager")(app);


var tickers = "AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

// var tickers = "AAPL,CSCO,MSFT,INTC".split(",");
console.log("Loading prices for", tickers.length, "tickers");
setTimeout(function() {
    // Broker.startStreaming(tickers, _.noop)
    // Broker.startStreaming(tickers, function () {
    //
    //
    //     setTimeout(function() {
    //         Broker.getMarketPriceBulk(tickers, function (err, prices) {
    //             if(err) console.error("ERROR while loading prices", err);
    //             Broker.stopStreaming();
    //
    //             console.log("=== Prices ===");
    //             _.each(prices, function (info, ticker) {
    //                 console.log(ticker,"|", info.price,"|",info.origin);
    //             });
    //         });
    //     }, 10000);
    //
    // });

    Broker.sendBuyOrder("AAPL",  80, "MKT", console.log.bind(null, "BUY SENT"), console.log.bind(null, "BUY DONE"));
    // Broker.printOrders();
}, 500);

