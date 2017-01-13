/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var moment = require("moment");
var Promise = require("bluebird");
var server = require('../modules/Web/Server');
var conf = require("../config/config");
var app = server.run(conf);
var DB = require('../modules/Core/Mysql')(conf.mysql);
var request = Promise.promisify(require("request"));

app.set("db",DB);
Promise.promisifyAll(request);

const _TABLE = "stock_history_full_quandl";

var dateFrom = moment('1990-01-01');
var dateTo = moment();


if(!conf.quandlApiKey) {
	console.error('You have to provide a "quandlApiKey" in your env.json config')
	process.exit(1);
}
var url = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?date.gte=$$from$$&date.lt=$$to$$&ticker=$$ticker$$&api_key="+conf.quandlApiKey;


var tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM"
tickers += ",ABT,AEP,ALL,AMGN,AVP,AXP,BA,BAC,BAX,BHI,BK,BMY,BNI,C,CAT,CL,CMCSA,COF,COP,COV,CPB,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EMC,ETR,EXC,F,FDX,GD,GE,GILD,GOOGL,GS,HAL,GD,HNZ,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LMT,LOW,MA,MCD,MDLZ,MDT,MER,MMM,MO,MRK,MS,MSFT,NOV,NSC,NIX,ORCL,OXY,PEP,PFE,PG,JPM,RF,RTN,S,SGP,SLB,HSH,SO,T,TGT,TWX,TXN,TYC,UNH,UPS,USB,UTX,WB,WBA,WFC,WMB,WMT,WY,WYE,VZ,XOM,XRX"


if(process.argv[2])
  tickers = process.argv[2];

function f(date) {
	return date.format("YYYY-MM-DD");
}

function getUrl(from, to, ticker) {
	return url
		.replace("$$from$$", from.format('YYYYMMDD'))
		.replace("$$to$$", to.format('YYYYMMDD'))
		.replace("$$ticker$$", ticker)
}
function downloadHistory(ticker) {
  return DB.get('date', _TABLE, 'ticker = ?', ticker, 'date', 'DESC')
    .then((res) => {
      var from = (res
          ? moment(res.date).add(1, 'day')
          : dateFrom
      );

      var formatedFrom = f(from);
      var formatedTo = f(dateTo);

      if(!dateTo.isAfter(from) || formatedFrom == formatedTo)
        return Promise.resolve(null)

      var url = getUrl(from, dateTo, ticker);
      console.log(("Reading "+ticker+" history data from "+formatedFrom+" to " + formatedTo).yellow);
			console.log(url)

      return request(url)
				.then((res) => {
          var data = JSON.parse(res.body);
					data = data.datatable.data;

					return saveData(ticker, data, url)
        })
    });
}

function saveData(ticker, data, url) {
  var out = {};
  out[ticker] = data.length;

  if(!data.length)
    return Promise.resolve(out);

  data = data.filter((row) => row[5])

  if(!data.length) {
    console.log('NO data for %s'.red, ticker)
    return;
  }

  console.log("Saving from URL:", url)
  return DB.insertMultiple(
    _TABLE+' (ticker, date, open, high, low, close, volume, exDividend, splitRatio, adjOpen, adjHigh, adjLow, adjClose, adjVolume)',
    data)
		.then(() => data.length);
}


tickers = tickers.split(",");
console.log("Loading stock history for %d tickers", tickers.length);
Promise.map(tickers, downloadHistory, { concurrency: 2})
  .then(res => {
    console.log('Result:', JSON.stringify(res));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    console.dir(err, { depth: 100 });
    process.exit(1);
  });
