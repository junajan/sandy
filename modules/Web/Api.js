
var Api = function(app) {
	var self = this;
	var config = app.config;
	var DB = app.DB;

	var Yahoo = require(config.dirLoader+'HistYahoo');


	this.openPrices = {'MO': 123};

	this.getWatchlist = function(req, res) {
		DB.getData('*', 'watchlist', function(err, data) {
			res.json(data);
		});
	};

	this.getConfig = function(req, res) {
		DB.getData('*', 'config', function(err, data) {
			var c = {};

			for(var i in data)
				c[data[i]['var']] = data[i].val;
			res.json(c);
		});
	};

	this.getEquity = function(req, res) {
		var from = req.query.from || 0;
		DB.getData('*', 'equity_history', 'date > ?', from, 'date', 'ASC', function(err, data) {
			res.json(data);
		});
	};

	this.getOrders = function(req, res) {
		var limit = parseInt(req.query.limit) || null;

		DB.getData('id, ticker, pieces, amount, open_price, open_date, close_price, close_date', 'positions', '1=1', null, 'ISNULL(close_date)', 'DESC, close_date DESC, open_date DESC', limit, function(err, data) {
			res.json(data);
		});
	};

	this.getLog = function(req, res) {
		res.json([]);
	};

	this.getOpenPrices = function(req, res) {
		res.json(self.openPrices);
	};

	this.loadUfinishedPrices = function() {
		DB.getData('ticker', 'positions', 'close_date IS NULL', function(err, tickers) {
			tickers = tickers.map(function(p) {
				return p.ticker;
			});
			Yahoo.actual(tickers, function(err, res) {
				var out = {};

				if(err)
					console.error(err);
				else if(res)
					res.map(function(d) {
						out[d[0]] = d[1];
					});

				self.openPrices = out;
			});
		});
	};
	
	setInterval(this.loadUfinishedPrices, 10000);
	return this;
};

module.exports = function(app) {
    return new Api(app);
};