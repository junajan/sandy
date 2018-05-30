'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var _ = require("lodash");
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var ydl = require(config.dirLoader+'HistYahoo');

var app = {
	config: config,
	DB: DB,
	emit: _.noop
};

config.disabledOrders = true;
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = function (type) {
	return app.logger.getLogger(type);
};


var Strategy = require(config.dirStrategy+'Strategy90')(app);

const RUN = true;
const _TABLE = "stock_history_full";

var dateFrom = moment('1990-01-01');
var dateTo = moment();

// var tickers = ['ABT','ACN','AIG','ALL','AMGN','AMZN','APA','APC','AXP','BA','BAC','BAX','BIIB','BK','BMY','BRK-B','C','CAT','CL','CMCSA','COF','COP','COST','CSCO','CVS','CVX','DD','DIS','DOW','DVN','EBAY','EMC','EMR','EXC','F','FB','FCX','FDX','FOXA','GD','GE','GILD','GM','GOOG','GS','HAL','HD','HON','HPQ','IBM','JNJ','JPM','KO','LLY','LMT','LOW','MA','INTC','MCD','MDLZ','MDT','MET','MMM','MO','MON','MRK','MS','MSFT','NKE','NOV','NSC','ORCL','OXY','PEP','PFE','PG','PM','QCOM','RTN','SBUX','SLB','SO','SPG','T','TGT','TWX','TXN','UNH','UNP','UPS','USB','UTX','V','VZ','WFC','WMT','XOM','WBA','AAPL','ABBV'];
// tickers = tickers.concat(['UPRO','SPXS', 'SPY', "LABU", "LABD"]);
// tickers = tickers.concat(['VXX', 'VIX', 'XIV']);
// tickers = tickers.concat(['VXX', 'VIX', 'XIV']);
// tickers = tickers.concat(["XLY", "XLP", "XLE", "XLF", "XLV", "XLI", "XLU", "XLB", "XLK"]);
// tickers = tickers.concat(["MDY", "FEZ", "EPP", "EEM", "ILF", "TLT", "SHY"]);
// tickers = tickers.concat(["MDY", "ZIV", "EDV", "SHY"]);
// tickers = tickers.concat(["MDY", "IEV", "EEM", "ILF", "EPP", "EDV", "SHY"]);
// tickers = tickers.concat(["AGG", "EFA", "IWM", "SPY", "ZIV", "SSO", "EDV"]);
// tickers = tickers.concat(["TSLA"]);
// var tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NEE,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TSLA,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
var tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,BRK-B,C,CAT,CELG,CHTR,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,DWDP,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NEE,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TSLA,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

function downloadHistory(ticker, done) {
	DB.get('date', _TABLE, 'symbol=?', ticker, 'date', 'DESC', function(err, res) {
		if(err) throw err;
		var to = dateTo.format('YYYY-MM-DD');
		var from = dateFrom;
		if(res)
			 from = moment(res.date).add(1, 'day');

		if(!moment(to).isAfter(from))
			return done(null, 0);

		from = from.format('YYYY-MM-DD')
		console.log(("Reading "+ticker+" history data from "+from +" to " + to).yellow);

		if(from === dateTo) {
			console.log(">> skipping - no data to load");
			return done(null, 'No days to import');
		}
		ydl.historical({
			symbol: ticker,
			from: from,
			to: to
		}, function(err, res) {
			if(err)
				throw err;
			
			res.map(function(item){
				item.date =  moment(item.date).format("YYYY-MM-DD HH:mm:ss");
				return item;
			});

			saveData(ticker, Strategy.serializeHistoricalData(0, {abcd: res}), done);
		});
	});
}

function saveData(ticker, data, done) {
	var out = {};
	out[ticker] = data.length;

	if(!data.length)
		return done(null, out);
	DB.insertValues(
		_TABLE+' (import_id, date, open, high, low, close, volume, adjClose, symbol)',
		data, function(err, res) {
			done(err, out);
		});
}

if(RUN) {
	async.mapLimit(tickers, 2, downloadHistory, function(err, res) {
		if(err)
			console.error('Error:', err);
		console.log('Result:', JSON.stringify(res));
		process.exit(0);
	});
}
