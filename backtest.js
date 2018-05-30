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

var tickers = "ABT,ACN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BMY,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DIS,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,JNJ,JPM,KO,LLY,LMT,LOW,MA,INTC,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WFC,WMT,XOM,WBA,AAPL,ABBV,AGN,PYPL,KMI,KHC,DUK,DHR,CELG,BLK,DWDP,CHTR".split(",");
// var tickers = "PG".split(",");

Log.info("Running Backtest");

config = {
  tickers: tickers,
  // from: '2017-01-02',
  from: '2007-01-01',
  to: '2018-03-23',
  // to: moment().format('YYYY-MM-DD'),
  capital: 135738,
  monthlyAdd: 0,
  mailLog: false,
  feesDisabled: false,
  processingDelay: false
  // processingDelay: 10000
};

Backtest.wipe(config, function() {
  Backtest.run(config, function(){}, function(){});
});
