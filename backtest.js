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

var tickers = ""
tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

// == TICKERS S&P100 from 2009
// tickers = "ABT,AEP,ALL,AMGN,AVP,AXP,BA,BAC,BAX,BHI,BK,BMY,BNI,C,CAT,CL,CMCSA,COF,COP,COV,CPB,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EMC,ETR,EXC,F,FDX,GD,GE,GILD,GOOGL,GS,HAL,GD,HNZ,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LMT,LOW,MA,MCD,MDLZ,MDT,MER,MMM,MO,MRK,MS,MSFT,NOV,NSC,NIX,ORCL,OXY,PEP,PFE,PG,JPM,RF,RTN,S,SGP,SLB,HSH,SO,T,TGT,TWX,TXN,TYC,UNH,UPS,USB,UTX,WB,WBA,WFC,WMB,WMT,WY,WYE,VZ,XOM,XRX".split(",")
// tickers = "ABT,AEP,ALL,AMGN,AXP,BA,BAC,BAX,BHI,BK,BMY,BNI,C,CAT,CL,CMCSA,COF,COP,COV,CPB,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EMC,ETR,EXC,F,FDX,GD,GE,GILD,GOOGL,GS,HAL,GD,HNZ,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LMT,LOW,MA,MCD,MDLZ,MDT,MER,MMM,MO,MRK,MS,MSFT,NOV,NSC,NIX,ORCL,OXY,PEP,PFE,PG,JPM,RF,RTN,S,SGP,SLB,HSH,SO,T,TGT,TWX,TXN,TYC,UNH,UPS,USB,UTX,WB,WBA,WFC,WMB,WMT,WY,WYE,VZ,XOM,XRX".split(",")



Log.info("Running Backtest");

config = {
  tickers: tickers,
  // from: "2015-01-01",
  // from: '2007-01-01',
  from: '1995-01-01',
  // to: '2016-01-01',
  // to: '2016-10-10',
  to: moment().format('YYYY-MM-DD'),
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
