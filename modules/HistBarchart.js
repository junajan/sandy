var csv = require("fast-csv");
var request = require('request');
var _ = require('lodash');
var async = require('async');
var moment = require('moment');


function chunkArray(array, chunkSize) {
    return [].concat.apply([],
        array.map(function(elem,i) {
            return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
        })
    );
}

function bDownloader() {
	var self = this;
	var historyUrl = "http://marketdata.websol.barchart.com/getHistory.json?key=419094f12f68553970480282838353f9&dividends=0&splits=0&symbol=$$symbol$$&type=daily&startDate=$$startDate$$"
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
				if(item.open== null) continue;
				importData.push([
					importId,
					item.timestamp,
					item.open,
					item.high,
					item.low,
					item.close,
					item.volume,
					item.symbol,
				]);
			}
		});

		return importData;
	};
	
	this.deleteHistory = function(db, done) {
		db.delete('stock_history_full', '1=1', done);
	};

	this.importHistory = function(db, importId, tickers, from, to, cb) {
		self.getArray(tickers, from, to, function(err, res) {
			db.insertValues(
				'stock_history_full (import_id, date, open, high, low, close, volume, adjClose, symbol)',
				self.serializeHistoricalData(importId, [].concat(res)),cb);
		});
	};

	this.cleanImport = function(db, tickers, done) {
		var config = {
			from: "1990-01-01",
			to: moment().format('YYYY-MM-DD')
		};

		var importId = 1;
		self.deleteHistory(app.get('db'), function() {
			async.mapSeries(chunkArray(tickers, 10), function(tChunk, done) {
				self.importHistory(app.get('db'), 1, tChunk, config.from, config.to, done);
			}, done);
		});
	};

	this.historical = function(conf, done) {
		var from = moment(conf.from, "YYYY-MM-DD").format('YYYYMMDD');
		var to = moment(conf.to, "YYYY-MM-DD").format('YYYYMMDD');
		var url = historyUrl.replace('$$symbol$$', conf.symbol).replace('$$startDate$$', from).replace('$$endDate$$', to);

		request(url, function(err, res) {
			if(err) return err;

			try {
				res = JSON.parse(res.body);
			} catch(e) {
				return done('bad json');
			}

			return done(err, res.results);
		});
	};

	this.get = function(ticker, from, to, cb) {
		console.log("Getting ticker", ticker, "from", from, "to", to);
		yahooFinance.historical(_wrapConf(ticker, from, to),cb);
	};

	this.getArray = function(arr, from, to, cb) {
		async.mapLimit(arr, 10, function(ticker, done){
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

	this.intradayHistory = function(ticker, from, to, done) {
		from = new Date(from).getTime() / 1000;
		to = new Date(to).getTime() / 1000;

		var url = 'https://finance-yql.media.yahoo.com/v7/finance/chart/'+ticker+'?period2='+to+'&period1='+from+'&interval=1m&indicators=quote%7Csma~5%7Crsi~2&includeTimestamps=true&includePrePost=true&events=div%7Csplit%7Cearn&corsDomain=finance.yahoo.com'
		console.log(' << '+url);
		request(url, function (error, response, body) {
			if(error || response.statusCode !== 200)
				return done(error);

			done(error, body);
		});
	};

	return this;
}

module.exports = new bDownloader();
