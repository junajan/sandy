"use strict";
/**
 * This is Sandy!
 * Sandy is a Node.JS tool for backtesting and automatic online trading on stock markets
 */

require('colors');
var moment = require("moment");

// load configuration
var config = require("./config");

// load and start web server
var server = require(config.dirWeb+'Server');

var app = server.run(config);
require("./config/app")(app, config);
app.DB = require(config.dirCore+'Mysql')(config.mysql);
app.mailer = require(config.dirCore+'Mailer')(app);

var Strategy = require(config.dirStrategy+'Strategy90')(app);
var Backtest = require(config.dirCore+'Backtest')(Strategy, app.DB);
var Log = app.logger.getLogger("APP");

require(config.dirWeb+'Routes')(app);

var tickers = "AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

Log.info("Running Backtest");

config = {
  tickers: tickers,
  // from: "2015-01-01",
  // from: '2008-01-01',
  from: '2017-01-01',
  to: '2017-10-10',
  // to: moment().format('YYYY-MM-DD'),
  capital: 10000 * 2,
  monthlyAdd: 0,
  mailLog: false,
  feesDisabled: false,
  processingDelay: false
  // processingDelay: 10000
};

Backtest.wipe(config, function() {
  Backtest.run(config, function(){}, function(){});
});
