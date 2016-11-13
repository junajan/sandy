/**
 * This will import historical data to Mysql table
 */

require('colors');
var Promise = require("bluebird");
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);

var app = {
	config, DB
};

var StockHistory = require(config.dirLoader+'StockHistory')(app)

const _TABLE = "stock_history_full";
var dateFrom = moment(process.argv[3] || '1990-01-01');
var to = moment(process.argv[4] || undefined).format('YYYY-MM-DD');

var tickers = "MDY,IEV,EEM,ILF,EPP,EDV,SHY";
if(process.argv[2])
	tickers = process.argv[2];

function downloadHistory(ticker, done) {

	return DB.get('date', _TABLE, 'ticker = ?', ticker, 'date', 'DESC')
		.then((res) => {
			var from = (res
				? moment(res.date).add(1, 'day')
				: dateFrom
			).format('YYYY-MM-DD');

			if(!moment(to).isAfter(from) || from == to)
				return done(null, 0);

			console.log(("Reading "+ticker+" history data from "+from +" to " + to).yellow);
			return StockHistory.getHistory(ticker, from, to)
				.then(data => saveData(ticker, data));
		});
}

function saveData(ticker, data) {
	var out = {};
	out[ticker] = data.length;

	if(!data.length)
		return Promise.resolve(out);

	return StockHistory.saveHistory(ticker, data)
		.then(() => out);
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
		process.exit(1);
	});
