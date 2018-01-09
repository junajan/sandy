var _ = require('lodash');
var async = require('async');
var moment = require('moment');

var Api = function(app) {
	var self = this;
  var config = app.config;
	var DB = app.DB;
	var Log = app.getLogger("WEB-API");
  var DataProvider = require(config.dirLoader+'IEX')();

	this.openPrices = {};

	this.getWatchlistIndicators = function(req, res) {
    DB.getData('date, ticker, sma200, price', 'indicators', 'import_id = (SELECT MAX(import_id) FROM indicators)', function(err, data) {
    	if(err || !data.length)
    		return res.json({})

      var out = {
    		date: data[0].date,
    		total: data.length,
    		healthy: 0,
				watchlist: {}
			};

    	data.forEach(function(item) {
				out.watchlist[item.ticker] = [
					item.price,
					item.sma200
        ];

				if(Number(item.price) > Number(item.sma200))
					out.healthy++;
      });
    	res.json(out);
    });
  };

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

		var equitySql = "SELECT *, capital + tSum as adjCapital " +
			"FROM (" +
			"SELECT h.*, IFNULL(SUM(t.amount), 0) as tSum " +
			"FROM equity_history as h " +
			"LEFT JOIN transfers t " +
				"ON t.date > h.date " +
			"GROUP BY h.date, h.id, h.import_id ORDER BY h.date) as tmp " +
			"WHERE DATE(date) > DATE(?) ORDER BY date ASC";

		var transferSql = "SELECT * FROM transfers t WHERE DATE(date) > DATE(?) ORDER BY date ASC";


    async.parallel({
      equity: function(done) {
        DB.sql(equitySql, from, done)
      },
			transfers: function(done) {
        DB.sql(transferSql, from, done)
      }
		}, function(err, data) {
    	if(err) return res.json(err)
      res.json(data);
		})
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
		// Log.info('Reading realtime prices');
    DB.getData('ticker', 'positions', 'close_date IS NULL', function(err, tickers) {
      if(err)
        return Log.error('There was an error while retrieving data from DB', err);

      tickers = _.map(tickers, 'ticker');
      if(DataProvider) {
      	DataProvider.realtimePrices(tickers, function(err, res) {
					if(err)
						return Log.error("There was an error when requesting actual prices", err);

					self.openPrices = _.defaults(res || {}, self.openPrices);
          setTimeout(self.loadUfinishedPrices, 20000);
				});
			}
    });
  };

  this.loadUfinishedPrices();
  return this;
};

module.exports = function(app) {
    return new Api(app);
};