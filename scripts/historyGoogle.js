'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var moment = require("moment");
var config = require("../config");
var googleFinance = require('google-finance');

var dateFrom = moment('2017-05-17');
var dateTo = moment('2017-05-17');

var tickers = "AAPL,LMT".split(",");

function downloadHistory(ticker, done) {
	var to = dateTo.format('YYYY-MM-DD')
	var from = dateFrom.format('YYYY-MM-DD')
	console.log(("Reading "+ticker+" history data from "+from +" to " + to).yellow);

  googleFinance.historical({
		symbol: ticker,
		from: from,
		to: to
	}, function(err, res) {
		if(err)
			throw err;
		done(false, {
			ticker: ticker,
			data: res
    })
	});
}

async.mapLimit(tickers, 2, downloadHistory, function(err, res) {
	if(err)
		return console.error('Error:', err);

	let readed = 0
	res.forEach(function (item) {
		if(item.data.length)
			readed++
		else
			console.log("%s was not loaded properly", item.ticker)
  })

  const total = res.length
	console.log("Total: %d | Loaded: %d | Errors: %d", total, readed, total - readed)
	process.exit(0);
});
