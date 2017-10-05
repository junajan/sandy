require('colors');
const _ = require('lodash');
const moment = require('moment');
const async = require("async");
Promise = require('bluebird');

const EventEmitter = require('events');
const config = require("../config");
const DB = require(config.dirCore+'Mysql')(config.mysql);

class App extends EventEmitter {}
const app = new App()

config.disabledOrders = true;
app.config = config;
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = type => app.logger.getLogger(type)

const Broker = require(config.dirConnector+config.connector.driver)(config.connector.config, app);
const today = moment().format('YYYYMMDD')
let tickers = ("ABT,ACN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BMY,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DIS,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,JNJ,JPM,KO,LLY,LMT,LOW,MA,INTC,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WFC,WMT,XOM,WBA,AAPL,ABBV,AGN,PYPL,KMI,KHC,DUK,DHR,CELG,BLK,DWDP,CHTR").split(",");

tickers = "SPXS".split(",");

app.on('API.ready', function() {
  console.log("============= START ============".red)

  console.log("Downloading %d tickers", tickers.length)
  console.time('Loading finished')
  Promise.map(tickers, ticker =>
    Broker.getDailyHistory(ticker, today, 300)
      .tap((data) => console.log("Ticket finished:".yellow, ticker, data.length))
      .then(data => ({ ticker, data }))
  , { concurrency: 5 })
    .then((data) => {
      console.log("RES === ")
      for(const tickerData of data) {
        console.log(tickerData.ticker, tickerData.data.length)
      }
      console.timeEnd('Loading finished')
    })
    .catch((err) => {
      console.log(err)
      process.exit(1)
    })
    .finally(() => {
      Broker.disconnect()
    })
})
