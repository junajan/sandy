'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var moment = require("moment");
var config = require("../config");
var yahooFinance = require('yahoo-finance');

var dateFrom = moment('2000-01-01');
var dateTo = moment();

var tickers = "SPY,".split(",");

function downloadHistory(ticker, done) {
	var to = dateTo.format('YYYY-MM-DD')
	var from = dateFrom.format('YYYY-MM-DD')
	console.log(("Reading "+ticker+" history data from "+from +" to " + to).yellow);

  yahooFinance.historical({
		symbol: "SPY",
		from: from,
		to: to
	}, function(err, res) {
		if(err)
			throw err;
		console.log(res);
		done(false)
	});
}

async.mapLimit(tickers, 2, downloadHistory, function(err, res) {
	if(err)
		console.error('Error:', err);
	process.exit(0);
});
