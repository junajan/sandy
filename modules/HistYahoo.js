var csv = require("fast-csv");
var yahooFinance = require('yahoo-finance');
var request = require('request');
var _ = require('lodash');
var async = require('async');

function yDownloader() {
	var self = this;
	// var _defaultFields = ['s', 'n', 'd1', 'l1', 'y', 'r'];
	// var _fields;

	function _wrapConf(ticker, from, to) {
		return {
			symbol: ticker,
			from: from,
			to: to,
		};
	}

	// this.setFields = function(f) {
	// 	_fields = f || _defaultFields;
	// };

	this.serializeHistoricalData = function(importId, data) {
		var importData = [];
		Object.keys(data).forEach(function(ticker) {
			for(var i in data[ticker]) {
				var item = data[ticker][i];
				importData.push([
					importId,
					item.date,
					item.open,
					item.high,
					item.low,
					item.close,
					item.volume,
					item.adjClose,
					item.symbol,
				]);
			}
		});

		return importData;
	};
	
	this.importHistory = function(db, importId, tickers, from, to, cb) {
		self.getArray(tickers, from, to, function(err, res) {
			db.insertValues(
				'stock_history_full (import_id, date, open, high, low, close, volume, adjClose, symbol)',
				self.serializeHistoricalData(importId, [].concat(res)),cb);
		});
	}

	this.historical = function(conf, done) {
		yahooFinance.historical(conf, done);
	};

	this.get = function(ticker, from, to, cb) {
		yahooFinance.historical(_wrapConf(ticker, from, to),cb);
	};

	this.getArray = function(arr, from, to, cb) {
		async.map(arr, function(ticker, done){
			self.get(ticker, from, to, done);
		}, cb);
	};

	this.actual = function(stock, done) {
		if(_.isArray(stock))
			stock = stock.join(',');

		var url = 'http://download.finance.yahoo.com/d/quotes.csv?f=sl1&s='+stock;

		request(url, function (error, response, body) {
			if(error || response.statusCode !== 200)
				return done(error);

			var buffer = [];

			csv.fromString(body)
				.on("data", function(data) {
					buffer.push(data);
				})
				.on("error", done)
				.on("end", function(res) {
					done(null, buffer);
				});
		});

	};

	return this;
}

module.exports = new yDownloader();
