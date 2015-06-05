var Api = function(app) {
	var self = this;
	var DB = app.get('db');

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

		DB.getData('id, ticker, pieces, amount, open_price, open_date, close_price, close_date', 'positions', '1=1', null, 'close_date', 'ASC', limit, function(err, data) {
			res.json(data);
		});
	};

	this.getLog = function(req, res) {
		res.json([]);
	};

	return this;
};

module.exports = function(app) {
    return new Api(app);
};