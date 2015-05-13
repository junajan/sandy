var request = require('request');
var cheerio = require('cheerio');

var Tickers = function(app) {
	const T_NAME = 'watchlist';
	const WIKI_SP100_LIST_URL = 'http://en.wikipedia.org/wiki/S%26P_100';
	const BARCHART_SP100_LIST_URL = 'http://www.barchart.com/stocks/sp100.php?_dtp1=0';
	var self = this;
	var data = [];
	var DB = app.get("db");
	var Log = require("./Log")(app, "TICK");

	self.getSP100Wiki = function(cb) {
		console.log("Downloading from ... ", WIKI_SP100_LIST_URL);
		request(WIKI_SP100_LIST_URL, function(err, res, body) {
			var data = [];

			if(err)
				return cb(err);

			body = body.replace(/[\n\t]*/g, '').match(/<table.*?><tr><th>Symbol<\/th><th>Name<\/th>.*?<\/table>/g);
			
			if(!body[0])
				return cb("Page is invalid");

			var $ = cheerio.load(body[0]);
			$('tr').each(function(i, tr) {
				var ticker = $(this).find("td:first-child").text();
				var name = $(this).find("td:nth-child(2) a").text();
				if(ticker)
			    	data.push({ticker: ticker, name: name});
			});

			console.log("Loaded data count.. ", Object.keys(data).length);
			cb(err, data);
		});
	};

	self.getSP100Barchart = function(cb) {
		request(BARCHART_SP100_LIST_URL, function(err, res, body) {
			if(err)
				return cb(JSON.stringify(err));

			var data = [];
			var $ = cheerio.load(body);
			var list = $('#frmFlipCharts input[name=symbols]');
			if(!list)
				return cb("Page is invalid");

			$('#dt1 tbody tr').each(function(i, tr) {
				var ticker = $(this).find("td:first-child").text();
				var name = $(this).find("td:nth-child(2)").text();;

				if(ticker)
			    	data.push({ticker: ticker, name: name});
				data.push({ticker: ticker, name: name});
			});

			cb(err, data);
		});
	};

	self.init = function() {
		DB.getData("*", "watchlist", function(err, res) {
			if(err)
				return Log.err("WTICK", err);

			DB.print(err, res);
			self.data = res;
		});

		return self;
	};

	self.get = function(v) {
		if(!self.data[v])
			return self.data[v];
		return null;
	};

	self.set = function(v, d) {
		var obj = {};
		obj[v] = d;

		if(self.data[v])
			DB.update(T_NAME, obj, "var = ?", v);
		else
			DB.insert(T_NAME, obj);
		self.data[v] = d;
	};

	return self.init();
};

module.exports = function(app) {
	return new Tickers(app);
};
