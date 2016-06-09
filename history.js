/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var moment = require("moment");
var server = require('./modules/Server');
var conf = require("./config/public")(server.app);
var app = server.run(conf);
var DB = require('./modules/Mysql')(conf.mysql);
app.set("db",DB);
var Strategy = require('./modules/Strategy')(app);
var ydl = require('./modules/HistYahoo');


const RUN = true;


var dateFrom = '1990-01-01';
var dateTo = moment().format('YYYY-MM-DD');
const _TABLE = "stock_history_full";

var tickers = ['ABT','ACN','AIG','ALL','AMGN','AMZN','APA','APC','AXP','BA','BAC','BAX','BIIB','BK','BMY','BRK-B','C','CAT','CL','CMCSA','COF','COP','COST','CSCO','CVS','CVX','DD','DIS','DOW','DVN','EBAY','EMC','EMR','EXC','F','FB','FCX','FDX','FOXA','GD','GE','GILD','GM','GOOG','GS','HAL','HD','HON','HPQ','IBM','JNJ','JPM','KO','LLY','LMT','LOW','MA','INTC','MCD','MDLZ','MDT','MET','MMM','MO','MON','MRK','MS','MSFT','NKE','NOV','NSC','ORCL','OXY','PEP','PFE','PG','PM','QCOM','RTN','SBUX','SLB','SO','SPG','T','TGT','TWX','TXN','UNH','UNP','UPS','USB','UTX','V','VZ','WFC','WMT','XOM','WBA','AAPL','ABBV'];
// var tickers = ['UPRO','SPXS', 'SPY'];
// var tickers = ['VXX', 'VIX', 'XIV'];

function downloadHistory(ticker, done) {

	DB.get('date', _TABLE, 'symbol=?', ticker, 'date', 'DESC', function(err, res) {
		if(err) throw err;

		var from = dateFrom;
		if(res)
			 from = moment(res.date).add(1, 'day').format('YYYY-MM-DD');
			
		console.log(("Reading "+ticker+" history data from "+from +" to " + dateTo).yellow);
		ydl.historical({
			symbol: ticker,
			from: from,
			to: dateTo
		}, function(err, res) {
			if(err)
				throw err;
			saveData(ticker, Strategy.serializeHistoricalData(0, {abcd: res}), done);
		});
	});

};

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
		console.log(err, res);
		process.exit(0);
	});
}
