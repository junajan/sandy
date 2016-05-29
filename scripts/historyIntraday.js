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
var moment = require('moment');

const RUN = true;
var dateFrom = '2015-06-05';
var dateTo = '2015-06-08';
const _TABLE = "stock_intraday_history_full";

// var tickers = ['ABT','ACN','AIG','ALL','AMGN','AMZN','APA','APC','AXP','BA','BAC','BAX','BIIB','BK','BMY','BRK-B','C','CAT','CL','CMCSA','COF','COP','COST','CSCO','CVS','CVX','DD','DIS','DOW','DVN','EBAY','EMC','EMR','EXC','F','FB','FCX','FDX','FOXA','GD','GE','GILD','GM','GOOG','GS','HAL','HD','HON','HPQ','IBM','JNJ','JPM','KO','LLY','LMT','LOW','MA','INTC','MCD','MDLZ','MDT','MET','MMM','MO','MON','MRK','MS','MSFT','NKE','NOV','NSC','ORCL','OXY','PEP','PFE','PG','PM','QCOM','RTN','SBUX','SLB','SO','SPG','T','TGT','TWX','TXN','UNH','UNP','UPS','USB','UTX','V','VZ','WFC','WMT','XOM','WBA','AAPL','ABBV'];
var tickers = ['SPY', 'UPRO','SPXS'];

function getImportInitStart() {
	return moment().subtract(45, 'day').format();
}

function downloadIntradayHistory(ticker, done) {
	console.log(("Reading "+ticker+" history data from "+dateFrom +" to " + dateTo).yellow);

	ydl.intradayHistory(ticker, dateFrom, dateTo, function(err, res) {
		if(err)
			throw err;

		if(!res) {
			
			console.error(' ========= NO DATA ========= ');
		}
			
		res = JSON.parse(res);
		
		if(res && res.chart && res.chart.error)
			return console.error(res.chart.error);

		if(res.chart && res.chart.result[0].timestamp) {

			res.chart.result[0].timestamp.forEach(function(t, i) {
				var time = moment(t * 1000).format();
				var data = res.chart.result[0].indicators.quote[0]; // [ 'high', 'volume', 'open', 'low', 'close' ]

				var row = {
					time: 	t,
					time_formated: 	time,
					open: 	data.open[i],
					high: 	data.high[i],
					low: 	data.low[i],
					close: 	data.close[i],
				};

				console.log(row);
			});


			// console.log(res.chart.result[0].indicators.quote);

			console.log('LEN: ', res.chart.result[0].timestamp.length)
		} else {
			console.error(' ========= NO DATA ========= ');
		}
		// console.log(err, res);
		// saveData(ticker, Strategy.serializeHistoricalData(0, {abcd: res}), done);
	});
};

// function saveData(ticker, data, done) {
// 	DB.insertValues(
// 		_TABLE+' (import_id, date, open, high, low, close, volume, adjClose, symbol)',
// 		data, function(err, res) {
// 			var out = {};
// 			out[ticker] = data.length;
// 			done(err, out);
// 		});
// }

if(RUN) {

	async.waterfall([
		DB.get.bind(DB, 'time_formated', _TABLE, '1=1', null, 'time_formated DESC'),
		function(time, done) {
			done(null, time ? time.time_formated : getImportInitStart());
		},
		function(from, done) {
			async.mapLimit(tickers, 1, downloadIntradayHistory.bind(this, from, moment().format()), done);
		}
	], function(err, res) {
		console.log(err, res);
	});
}

