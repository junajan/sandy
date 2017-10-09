require('colors');
const _ = require('lodash');
const moment = require('moment');
const HistoryService = require('../modules/Core/History');
Promise = require('bluebird');

const EventEmitter = require('events');
const config = require("../config");

class App extends EventEmitter {}
const app = new App()

config.disabledOrders = true;
app.config = config;
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = type => app.logger.getLogger(type)

// const Broker = require(config.dirConnector+config.connector.driver)(config.connector.config, app);
const History = new HistoryService(app);
const today = moment().subtract(1, 'day').format('YYYY-MM-DD')
let tickers = process.argv[3] || "ABT,ACN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BMY,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DIS,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,JNJ,JPM,KO,LLY,LMT,LOW,MA,INTC,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WFC,WMT,XOM,WBA,AAPL,ABBV,AGN,PYPL,KMI,KHC,DUK,DHR,CELG,BLK,DWDP,CHTR"
tickers = tickers.split(",");

const BAR_COUNT = process.argv[2] || 200;

app.once('API.ready', function() {
  console.log("============= START ============".yellow)

  console.log("Loading %d tickers", tickers.length)
  console.time('Loading finished')
  History.getHistoryMultiple(tickers, today, BAR_COUNT)
    .then((data) => {
      console.log("=== RES ===".yellow)

      for(const ticker of Object.keys(data)) {
        const tickerData = data[ticker]

        const info = {
          ticker,
          length: tickerData.length,
          first: tickerData[0],
          last: tickerData[tickerData.length - 1]
        }
        console.log(info);
      }
      console.timeEnd('Loading finished')
      process.exit()
    })
    .catch((err) => {
      console.log("Final ERROR:", err)
      process.exit(1)
    })
})
