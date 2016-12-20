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
	var _DB_FULL_HISTORY_TABLE = "stock_history_full";
	var _dateFormat = "YYYY-MM-DD";


	var _PERIOD = 20;

	var PERIOD_VOLAT = 21;
	var PERIOD_METRIC = 63;

	var FACTOR_PERFORMANCE = 0.7;
	var FACTOR_VOLATILITY = 0.3;

	var _ = require('lodash');

	function getMinMax(obj) {
		var values = _.values(obj);

		return {
			min: _.min(values),
			max: _.max(values)
		};
	}

	function rsVolatility(period, prices) {
		// Rogers and Satchell (1991)
		var r = [];

		for(var i = 0; i < period; i++) {
			var a = Math.log(prices[i]["high"] / prices[i]["close"]);
			var b = Math.log(prices[i]["high"] / prices[i]["open"]);
			var c = Math.log(prices[i]["low"] / prices[i]["close"]);
			var d = Math.log(prices[i]["low"] / prices[i]["open"]);
			r.push( a*b + c*d );
		}

		// Take the square root of the sum over the period - 1.  Then multiply
		// that by the square root of the number of trading days in a year
		var vol = Math.sqrt(_.sum(r) / period) * Math.sqrt(252/period);
		return vol;
	}

	function histVolatility(period, prices) {
		var returns = [];
		for(var i = period; i > 1; i--) {

			returns.push(Math.log(prices[i]["close"] / prices[i-1]["close"]));
			// console.log("%d = %d / %d", Math.log(prices[i]["close"] / prices[i-1]["close"]), prices[i]["close"], prices[i-1]["close"])
		}

		var rmean = _.sum(returns) / period;

		var diff = [];
		for(var ret of returns) {
			diff.push(Math.pow((ret - rmean), 2));
		}

		// console.log("Diffs:", diff);
		var vol = Math.sqrt(_.sum(diff) / (period - 1)) //  * Math.sqrt(252/period);
		return vol;
	}

	function getStockMetrics(symbol, metricPeriod, volatilityPeriod, prices) {
		// Frank GrossmannComments (114)
		// You can use the 20 day volatility averaged over 3 month.
		// For the ranking I calculate the 3 month performance of all ETF's and normalise between 0-1.
		// The best will have 1. Then I calculate the medium 3 month 20 day volatility and also normalize from 0-1.
		// Then I used Ranking= 0.7*performance +0.3*volatility.
		// This will give me a ranking from 0-1 from which I will take the best.

		// You can use the 20 day volatility averaged over 3 month.
		// For the ranking I calculate the 3 month performance of all ETF's and normalise between 0-1. The best will have 1. Then I calculate the medium 3 month 20 day volatility and also normalize from 0-1.
		// Then I used Ranking= 0.7*performance +0.3*volatility.
		// This will give me a ranking from 0-1 from which I will take the best.

		var period = metricPeriod;
		var volPeriod = volatilityPeriod - 1;
		var periodRange = metricPeriod / volPeriod;

		var startInd = prices.length - metricPeriod;
		var endInd = prices.length - 1;

		// console.log("Start ind %d | price: %j, End ind %d | price: %j", startInd, prices[startInd]["date"], endInd, prices[endInd]["date"]);

		// Calculate the period performance
		var start = prices[startInd]["close"]; // First item
		var end = prices[endInd]["close"]; // Last item
		var performance = (end - start) / start;

		var volats = [];

		for(var i = -1 * metricPeriod; i < -volPeriod; i++) {
			var start = prices.length + i;
			var end =  start + volatilityPeriod;
			var priceList = prices.slice(start, end);

			// console.log("Len %d | Start %d | End %d =====> (len: %d)", prices.length, start, end, priceList.length, priceList[0]["date"], " - ", priceList[priceList.length - 1]["date"]);
			volats.push(histVolatility(volPeriod, priceList));
      // volats.push(rsVolatility(volPeriod, priceList));
		}

		var volatility = _.sum(volats) / period;
		// var volatility = _.sum(volats) / periodRange;

		// console.log(volatility);
		// console.log("Symbol: %s, Volatility: %d, Performance %d", symbol, volatility, performance);
		return { performance, volatility };
	}

	function sortRanksComparator(a, b) {
		return b.rank - a.rank;
	}

	this.processRanks = function(config) {
		var performances = {};
		var volatilities = {};

		for(var ticker in config.indicators) {
			var inds = config.indicators[ticker];

			performances[ticker] = inds["performance"];
			volatilities[ticker] = inds["volatility"];
		}

		// volatilities["EDV"] *= 0.5

		var perf = getMinMax(performances);
		var volat = getMinMax(volatilities);

		var stockRanks = [];
		var rank;
		for(var symbol in config.indicators) {
			var p = (performances[symbol] - perf.min) / (perf.max - perf.min);
			var v = (volatilities[symbol] - volat.max) / (volat.min - volat.max);

			rank = null;
			if(!_.isNaN(p) && !_.isNaN(v)) {

			// Adjust volatility for EDV by 50%
				rank = (symbol == "EDV")
					? (p * FACTOR_PERFORMANCE) + (v * 0.5 * FACTOR_VOLATILITY)
					: (p * FACTOR_PERFORMANCE) + (v * FACTOR_VOLATILITY);

				// rank = (p * FACTOR_PERFORMANCE) + (v * FACTOR_VOLATILITY);
			}
			// console.log("%s | %s | %s | %s", symbol, p, v, rank)

			if(rank !== null)
				stockRanks.push({symbol, rank});
		}

		var bestStock = null;
		if(stockRanks.length) {

			if(stockRanks.length < Object.keys(config.history).length)
				console.log('FEWER STOCK RANKINGS THAN IN STOCK BASKET!');

			var sorted = stockRanks.sort(sortRanksComparator);
			// for(var r of sorted)
				// console.log('RANK [%s] %s', r.symbol, r.rank);

			bestStock = stockRanks[0].symbol;
		} else {
			console.log('NO STOCK RANKINGS FOUND IN BASKET; BEST STOCK IS: NONE')
		}

		config.bestTicker = bestStock;
		return Promise.resolve(config);
	};

	this.processIndicators = function(config) {
		Log.info('Processing indicators');
		config.indicators = {};

		for(const ticker in config.history) {
			const data = config.history[ticker];

			if(data.length < _PERIOD) {
				Log.error("Ticker %s does not have enough data for period %d - %d instead", ticker, _PERIOD, data.length);
				continue;
			}

			var { performance, volatility } = getStockMetrics(ticker, PERIOD_METRIC, PERIOD_VOLAT, data);

			config.indicators[ticker] = {
				ticker: ticker,
				performance, volatility,
				date: data[data.length - 1].date,
				sma5: Indicators.sma(5, data),
				sma10: Indicators.sma(10, data),
				sma15: Indicators.sma(15, data),
				price: data[data.length - 1].close,
				oldDate: data[data.length - PERIOD_METRIC].date,
				oldPrice: data[data.length - PERIOD_METRIC].close
			};
		}

		return Promise.resolve(config.indicators);
	};

	// TODO ==================================
	// TODO ==================================
	// TODO ==================================

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
		Log.info('Saving new equity', state);

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
		// Log.info('Retrieving config');
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
		Log.info("Closing %s", config.closeTicker)
		if(!config.closeTicker)
			return Promise.resolve();

		const pos = config.positionsAggregated[config.closeTicker];
		const ind = config.indicators[config.closeTicker];
		const capital = pos.amount * ind.price + config.newState.capitalFree;

		const profit = (ind.price - pos.open_price) * pos.amount;

		delete config.positionsAggregated[config.closeTicker];
		config.newState = {
			capital: capital,
			capitalFree: capital
		};
		console.log("Sell %s | Profit %d".yellow, ind.ticker, profit);

		return DB.update("positions", {
			close_price: ind.price,
			close_date: this.formatDate(config.date)
		}, "close_price IS NULL AND ticker = ?", config.closeTicker);
	};

	this.filterBuyStocks = function(config) {
		config.openTicker = null;
		config.closeTicker = null;

		if(config.bestTicker && !config.positions[config.bestTicker]) {
			config.openTicker = config.bestTicker;
			config.closeTicker = Object.keys(config.positions)[0];
		}

		return Promise.resolve();
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

	this.printState = function(config, state) {
		let openedTicker = config.openTicker;
		if(!openedTicker && Object.keys(config.positionsAggregated).length)
			openedTicker = Object.keys(config.positionsAggregated).pop();

		Log.info((
			"Current: Date: " + this.formatDate(config.date)
			+ " Equity: " + state.capital.toFixed(2)
			+ " Unused: " + state.capitalFree.toFixed(2)
			+ " Position: " + openedTicker
		).yellow);
		return Promise.resolve(config)
	};

	this.saveLastTrading = function(config) {
		return this.saveConfig({
			"lastTestDate": this.formatDate(config.date)
		});
	};

	this.snapshotEquity = function(config, save) {

		const openedTicker = Object.keys(config.positionsAggregated)[0];
		if(! openedTicker || !config.history[openedTicker])
			return Promise.resolve();

		const pos = config.positionsAggregated[openedTicker];
		const priceItem = config.history[openedTicker].pop();

		const state = {
			capital: config.oldState.capitalFree + pos.amount * priceItem["close"],
			capitalFree: config.oldState.capitalFree
		};

		if(!save)
			return this.printState(config, state)

		return this.saveNewEquity(config, state)
			.then(() =>
				this.printState(config, state)
			);
	};

	this.loadInitData = function(config) {
		return this.queryTickers(config)
		.then(tickers => this.getHistoricalPrices(config, tickers))
		.then(() => this.getOpenPositions(config));
	};

	this.init = function(config) {
		return this.getConfig(config)
			.then(() => {
				const lastTestDate = moment(config.settings.lastTestDate);
				config.isTradingDay = this.isTradingDate(config.date, lastTestDate);

				console.log(config.settings)
				return this.loadInitData(config)
			})
			.then(() => config)
	};

	this.isTradingDate = function(current, last) {
		const diff = moment.duration(current.diff(last)).asDays();
		return diff > _PERIOD && [1,2,3,4].indexOf(current.date()) >= 0;
	};

	this.mainProcess = function(config) {

		return this.saveLastTrading(config)
			.then(() => this.printState(config, config.oldState))
			.then(() => this.processRanks(config))
			// // .then(() => this.saveIndicators(config))
			.then(() => this.filterBuyStocks(config))
			.then(() => this.sendOrders(config))
			.then(() => this.printState(config, config.newState))
			.then(() => this.saveConfig(config.newState))
			.then(() => this.saveNewEquity(config, config.newState))
			.then(() => this.saveConfig({
				lastTestDate: this.formatDate(config.date)
			}))
			.catch(err => {
				Log.error("Strategy finished with an error", err);
				return Promise.reject(err);
			});
	};

	this.process = function(config) {
		return this.processIndicators(config)
			.then(() => {
				if(Object.keys(config.positionsAggregated).length) {

					let ticker = Object.keys(config.positionsAggregated)[0];
					var open = config.positionsAggregated[ticker]
					var current = config.indicators[ticker]

					console.log("OPEN:", open, "\nCURRENT:", current)

					var now = moment(config.date)
					var end = open.open_date
					var duration = moment.duration(now.diff(end));
					var days = duration.asDays();
					console.log("DIFF:", days)

					// if(days > 10 && current.sma10 < current.sma15) {
					// 	config.closeTicker = ticker;
          //
					// 	return this.sendSellOrder(config)
					// 		.then(() => this.saveNewEquity(config, config.newState))
					// 		.then(() => this.saveConfig(config.newState))
					// 		.then(() => this.printState(config, config.newState))
					// 		// .then(() => process.exit(1))
					// }
				}

				if(!config.isTradingDay)
					return this.snapshotEquity(config, false)
				return this.mainProcess(config)
			})
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};