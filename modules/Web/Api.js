var Api = function(app) {
	var self = this;
	var config = app.config;
	var DB = app.DB;
	var Log = app.getLogger("WEB-API");

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

	this.getFullConfig = function(req, res) {
		DB.getData('*', 'config', '1=1', null, "var", "ASC", function(err, data) {
			res.json(data);
		});
	};

	this.getOrders = function(req, res) {
		var limit = parseInt(req.query.limit) || null;

		DB.getData('id, ticker, pieces, amount, open_price, open_date, close_price, close_date', 'positions', '1=1', null, 'ISNULL(close_date)', 'DESC, close_date DESC, open_date DESC', limit, function(err, data) {
			res.json(data);
		});
	};

	this.getOrdersGroup = function(req, res) {
		var limit = parseInt(req.query.limit) || null;
		var from = '(SELECT SUM(amount) as amount, SUM(amount * open_price) AS open_price_total, ticker, SUM(close_price*amount) as close_price_total, close_date, MIN(open_date) as open_date_min, MAX(open_date) as open_date_max, COUNT(1) as scale FROM `positions` GROUP BY ticker, close_date) as tmp';

		DB.getData('*, close_price_total - open_price_total as profit', from, '1=1', null, 'ISNULL(close_date)', 'DESC, close_date DESC, open_date_min DESC', limit, function(err, data) {
			res.json(data);
		});
	};

	this.getHolidays = function(req, res) {
		DB.getData('*', 'exchange_schedule', 'invalidated IS NULL and YEAR(date) = YEAR(NOW())', null, 'date', 'ASC', function(err, data) {
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
			if(err)
				return Log.error('There was an error while retrieving data from DB', err);

			tickers = tickers.map(function(p) {
				return p.ticker;
			});
			Yahoo.actual(tickers, function(err, res) {
				var out = {};

				if(err)
					Log.trace("There was an error when requesting actual prices from Yahoo API", err);
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