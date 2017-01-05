/**
 * This will import historical data to Mysql table
 */

require('colors');

var barchartService = require("barchart-market-data-api");
var async = require("async");
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);

var app = {
  config: config,
  DB: DB
};
var bdl = require(config.dirLoader+'HistBarchart');


const RUN = true;
const _TABLE = "stock_history_full_barchart";

var dateFrom = '1990-01-01';
// var dateFrom = '2015-08-01';
var dateTo = moment().format('YYYY-MM-DD');

var tickers = "AAPL,ABBV,APA,APC,BAX,DVN,EMC,FCX,NOV,NSC,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NEE,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TSLA,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

function downloadHistory(ticker, done) {
	DB.get('date', _TABLE, 'symbol=?', ticker, 'date', 'DESC', function(err, res) {
		if(err) throw err;

		var from = dateFrom;
		if(res)
			 from = moment(res.date).add(1, 'day').format('YYYY-MM-DD');

		console.log(("Reading "+ticker+" history data from "+from +" to " + dateTo).yellow);
		bdl.historical({
			symbol: ticker,
			from: from,
			to: dateTo
		}, function(err, res) {
			if(err)
				throw err;

			var data = bdl.serializeHistoricalData(0, {abcd: res});
			saveData(ticker, data, done);
		});
	});
};

function saveData(ticker, data, done) {
	var out = {};
	out[ticker] = data.length;

	if(!data.length)
		return done(null, out);

	DB.insertValues(
		_TABLE+' (import_id, date, open, high, low, close, volume, symbol)',
		data, function(err, res) {
			done(err, out);
		});
}

if(RUN)
	async.mapLimit(tickers, 2, downloadHistory, function(err, res) {
		console.log(err, res);
	});