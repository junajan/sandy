"use strict";

var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var async = require('async');

var Strategy = function(app) {
	var self = this;
	var config = app.config;
	var DB = app.DB;
	var Log = app.getLogger("STRATEGY");

	// modules
	var Indicators = require(config.dirCore+'./Indicators');
	var StockHistory = require(config.dirLoader+'./StockHistory')(app);
	var Tickers = require(config.dirLoader+'./Tickers');

	// settings
	var _ROC_LEN = 14;
	var _DAYS_DELAY = 7;
	var _DB_FULL_HISTORY_TABLE = "stock_history_full";
	var _dateFormat = "YYYY-MM-DD";


    this.getNextPiecesCount = function(c) {
        if(!c) return 1;
		if(c == 1) return 2;
		if(c == 3) return 3;
		if(c == 6) return 4;

		throw "Err - not defined pieces count";
 	};

	function addWeekends(count) {
		return Math.floor(count / 5 * 7);
	}

	this.getWeekDaysInPast = function(days, from) {
		from = moment(from || moment());
		var dayNumber = from.day();
		if(dayNumber == 6) days++; // saturday
		if(dayNumber === 0) days += 2; // sunday
		return from.subtract(days || 0, 'days').format(_dateFormat);
	};

	this.deserializeHistoricalData = function(data) {
		var out = {};

		if(!data)
			return null;

		data.forEach(function(item) {
			if(!out[item.ticker]) out[item.ticker] = [];

			delete item.id;
			delete item.importId;
			out[item.ticker].push(item);
		});

		return out;
	};

	this.deserializeOpenPositions = function(pos) {
		var out = {};
		for(var i in pos) {
			var item = pos[i];

			if(!out[item.ticker])
				out[item.ticker] = [];

			out[item.ticker].push(item);
		}
		return out;
	};

	this.countWeightenedAverage = function(price1, amount1, price2, amount2) {
		return (price1 * amount1 + price2 * amount2) / (amount1 + amount2);
	};

	this.saveIndicators = function(config) {
		Log.info('Saving indicators');
		Log.warn('Saving indicators - NOT IMPLEMENTED');

		return Promise.resolve();
		// DB.insertValues("indicators (ticker, price)", buffer);
	};
	
	this.isLastPriceEntry = function(ticker, config, done) {
		if(!config.internalHistory)
			return done(false);

		DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and ticker = ?", [config.date.format(), ticker], function(err, res) {
			if(err)
				throw err;
			done(!res);
		});
	};

	// ===========================================================
	// ====================== REFACTORED =========================
	// ===========================================================

	this.saveNewEquity = function(config, state) {
		Log.info('Saving new equity');

		// dont save when there are no changes in positions
		return DB.insert("equity_history", {
			capital: state.capital,
			capitalFree: state.capitalFree,
			date: this.formatDate(config.date)
		});
	};

	this.formatDate = function(d) {
		return d.format(_dateFormat);
	};

	this.saveConfig = function(config) {
		Log.info('Saving config to DB');

		return Promise.map(Object.keys(config), (key) => {
			return DB.update("config", { val: config[key] }, "var=?", key);
		});
	};

	this.getConfig = function(config) {
		Log.info('Retrieving config');

		return DB.getData("*", "config", "1=1")
			.then(res => {
				config.settings = {};
				for(var i in res)
					config.settings[res[i]['var']] = res[i].val;

				config.oldState = {
					capital: Number(config.settings.capital),
					capitalFree: Number(config.settings.capitalFree)
				};

				return config;
			});
	};

	this.sendBuyOrder = function(config) {
		if(!config.openTicker)
			return Promise.resolve();

		Log.info("Opening new position %s", config.openTicker);

		const capital = config.newState.capital;
		const ind = config.indicators[config.openTicker];
		const amount = Math.floor(capital / ind.price);

		config.newState.capitalFree = capital - amount * ind.price;

		return DB.insert("positions", {
			ticker: ind.ticker,
			amount: amount,
			open_price: ind.price,
			open_date: this.formatDate(config.date)
		});
	};

	this.sendSellOrder = function(config) {
		if(!config.closeTicker)
			return Promise.resolve();

		const pos = config.positionsAggregated[config.closeTicker];
		const ind = config.indicators[config.closeTicker];
		const capital = pos.amount * ind.price + config.newState.capitalFree;

		delete config.positionsAggregated[config.closeTicker];
		config.newState = {
			capital: capital,
			capitalFree: capital
		};

		return DB.update("positions", {
			close_price: ind.price,
			close_date: this.formatDate(config.date)
		}, "close_price IS NULL AND ticker = ?", config.closeTicker);
	};

	this.filterBuyStocks = function(config) {
		config.openTicker = null;
		config.closeTicker = null;

		let bestTicker = null;
		let bestRoc = null;

		for(const ticker in config.indicators) {
			const ind = config.indicators[ticker];

			// TODO myslet i na prioritu v pripade jiz drzenych akcii
			if(bestRoc <= ind.roc)
				continue;

			bestTicker = ticker;
			bestRoc = ind.roc;
		}

		if(bestTicker && !config.positions[bestTicker]) {
			config.openTicker = bestTicker;
			config.closeTicker = Object.keys(config.positions)[0];
		}

		console.log("Filtered stocks: BUY %s | SELL %s", config.openTicker, config.closeTicker);
		return Promise.resolve();
	};

	this.processIndicators = function(config) {
		Log.info('Processing indicators');

		const colName = "close";
		config.indicators = {};

		for(const ticker in config.history) {
			const data = config.history[ticker];

			const price = data[data.length-1][colName];
			const priceOld = data[data.length-1 - _ROC_LEN][colName];
			const roc = Indicators.roc(price, priceOld);

			console.log("Ticker: %s \tOld: %d \tNew: %d \tROC: %d", ticker, priceOld, price, roc);

			if(price && priceOld) {
				config.indicators[ticker] = {
					roc, price, priceOld, ticker
				};

			} else
				delete config.data[ticker];
		}

		return Promise.resolve(config.indicators);
	};

	this.sendOrders = function(config) {
		config.newState = _.cloneDeep(config.oldState);

		return this.sendSellOrder(config)
			.then(() => this.sendBuyOrder(config))
	};

	this.aggregatePositions = function(pos) {
		var out = {};
		for(var i in pos) {
			var item = pos[i];

			if(!out[item.ticker])
				out[item.ticker] = item;
			else {
				out[item.ticker].pieces += item.pieces;
				out[item.ticker].open_price = self.countWeightenedAverage(out[item.ticker].open_price, out[item.ticker].amount, item.open_price, item.amount);
				out[item.ticker].amount = out[item.ticker].amount + item.amount;
			}
		}
		return out;
	};

	this.getOpenPositions = function(config) {
		Log.info('Selecting openned positions');

		return DB.getData("*", "positions", "close_date IS null", null, "open_date ASC")
			.then(res => {
				config.positions = this.deserializeOpenPositions(res);
				config.positionsAggregated = this.aggregatePositions(res);
			});
	};

	this.wipe = function(config) {
		Log.info("Clearing before start");

		return Promise.all([
				DB.delete("positions"),
				DB.delete("indicators"),
				DB.delete("equity_history"),
				this.saveConfig({
					capital: config.capital,
					capitalFree: config.capital,
					lastTestDate: this.formatDate(moment().add(-10, "year"))
				})
		]);
	};

	this.queryTickers = function(config) {
		if(config.tickers)
			return Promise.resolve(config.tickers);

		return DB.getData('ticker', 'watchlist', 'active = 1')
			.then(data => config.tickers = _.map(data, "ticker"));
	};

	this.getHistoricalPrices = function(config, tickers) {
		Log.info("Loading historical prices for %d tickers", tickers.length);
		config.history = {};

		return Promise.map(tickers, ticker => {
			const to = moment(config.date).add(-1, 'day');
			const from = moment(config.date).add(-150, 'day');

			return StockHistory.getHistory(ticker, this.formatDate(from), this.formatDate(to), !!config.backtest)
				.then(res => config.history[ticker] = res);
		}, { concurrency: 2 });
	};

	this.printState = function(config, state, positions) {
		let openedTicker = config.openTicker;
		if(!openedTicker && Object.keys(config.positionsAggregated).length)
			openedTicker = Object.keys(config.positionsAggregated).pop()

		Log.info((
			"Current: Date: " + this.formatDate(config.date)
			+ " Equity: " + state.capital.toFixed(2)
			+ " Unused: " + state.capitalFree.toFixed(2)
			+ " Position: " + openedTicker
		).yellow);
	};

	this.saveLastTrading = function(config) {
		return this.saveConfig({
			"lastTestDate": this.formatDate(config.date)
		});
	};

	this.isTradingDate = function(current, last) {
		const diff = moment.duration(current.diff(last)).asDays();
		return diff > _DAYS_DELAY;
	};

	this.snapshotEquity = function(config) {
		const openedTicker = Object.keys(config.positionsAggregated)[0];
		if(! openedTicker || !config.history[openedTicker])
			return Promise.resolve();

		const pos = config.positionsAggregated[openedTicker];
		const priceItem = config.history[openedTicker].pop();

		const state = {
			capital: config.oldState.capitalFree + pos.amount * priceItem["close"],
			capitalFree: config.oldState.capitalFree
		};

		return this.saveNewEquity(config, state)
			.then(() => this.printState(config, state));
	};

	this.init = function(config) {
		return this.getConfig(config)
			.then(() => this.queryTickers(config))
			.then(tickers => this.getHistoricalPrices(config, tickers))
			.then(() => this.getOpenPositions(config));
	};

	this.process = function(config) {
		if(! this.isTradingDate(config.date, moment(config.settings.lastTestDate))) {
			return this.snapshotEquity(config);
		}

		return this.saveLastTrading(config)
			.then(() => this.processIndicators(config))
			.then(() => this.saveIndicators(config))
			.then(() => this.filterBuyStocks(config))
			.then(() => this.printState(config, config.oldState))
			.then(() => this.sendOrders(config))
			.then(() => this.printState(config, config.newState))
			.then(() => this.saveConfig(config.newState))
			.then(() => this.saveNewEquity(config, config.newState))
			.catch(err => {
				Log.error("Strategy finished with an error", err);
				return Promise.reject(err);
			});
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};