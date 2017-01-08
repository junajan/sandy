"use strict";
/**
 * This is Sandy!
 * Sandy is a Node.JS tool for backtesting and automatic online trading on stock markets
 */

require('colors');
const _ = require("lodash");
const moment = require("moment");

// load configuration
let config = require("./config");

// load and start web server
const server = require(config.dirWeb+'Server');

const app = server.run(config);
require("./config/app")(app, config);
app.DB = require(config.dirCore+'Mysql')(config.mysql);
app.mailer = require(config.dirCore+'Mailer')(app);

const Strategy = require(config.dirStrategy+'UltOscilator')(app);
const Backtest = require(config.dirCore+'Backtest')(Strategy, app.DB);
const Log = app.logger.getLogger("APP");

require(config.dirWeb+'Routes')(app);

let tickers = "MDY,IEV,EEM,ILF,EPP,EDV,SHY".split(",");
tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
// tickers = "BRF,ECH,EIDO,EPI,EWA,EWC,EWG,EWH,EWI,EWJ,EWL,EWM,EWP,EWQ,EWS,EWT,EWU,EWW,EWY,EWZ,EZA,FXI,FXP,IWM,PIN,QQQ,RSX,SPY,THD,TUR".split(",");

Log.info("Running Backtest");

config = {
  internalHistory: true,
  tickers: tickers,
  // from: '2009-01-01',
  // from: '2007-01-01',
  // to: '2012-09-28',
  from: '2013-01-01',
  // from: '2010-05-23',
  to: moment().format('YYYY-MM-DD'),
  capital: 20000,
  mailLog: false
};

Backtest.wipe(config)
  .then(() => Backtest.run(config))
  .catch(err => console.error(err));