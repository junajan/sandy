"use strict";

/**
 * Buy and hold strategy for given ticker
 */

var _ = require('lodash');
var moment = require('moment');
var async = require('async');

var Strategy = function(app) {
	var self = this;
	var config = app.config;
	var DB = app.DB;
	var Log = app.getLogger("STRATEGY");

	// modules
	// var Indicators = require(config.dirCore+'./Indicators');
	var Tickers = require(config.dirLoader+'./Tickers');

	// settings
	var _PRICE_COLUMN_NAME = 'adjClose';
	var _DB_FULL_HISTORY_TABLE = "stock_history_full";
	var _dateFormat = "YYYY-MM-DD";

	if(!config.disabledOrders)
		var Broker = require(config.dirCore+"OrderManager")(app);

	function addWeekends(count) {
		return Math.floor(count / 5 * 7);
	}

	this.processTickers = function(config, info, done) {
		if(!config.tickers) config.tickers = [];
		
		if(info.tickers)
			config.tickers = info.tickers.map(function(item) {return item.ticker;});
		done(null, config);
	};

	this.getWeekDaysInPast = function(days, from) {
		from = moment(from || moment());
		var dayNumber = from.day();
		if(dayNumber == 6) days++; // saturday
		if(dayNumber === 0) days += 2; // sunday
		return from.subtract(days || 0, 'days').format(_dateFormat);
	};

	this.clearPreviousData = function(config, done) {
		if(config.dontPersist) return done(null, 1);

		// Log.info("Removing previous data imports");
		DB.delete("stock_history", "import_id < (SELECT MAX(import_id) FROM import_batch) - "+ _CLEAR_DATA_TTL, done);
	};

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
					item.symbol
				]);
			}
		});

		return importData;
	};
	
	this.deserializeHistoricalData = function(data) {
		var out = {};

		if(!data)
			return null;

		data.forEach(function(item) {
			if(!out[item.symbol]) out[item.symbol] = [];

			delete item.id;
			delete item.importId;
			out[item.symbol].push(item);
		});

		return out;
	};

	this.saveData = function(config, done) {
		Log.info("Saving data for "+ Object.keys(config.data).length +" tickers");

		if(config.internalHistory) {
			Log.info('Saving data - Using internal history so nothing was saved');
			return done(null, config);
		}

		DB.insertValues(
			'stock_history (import_id, date, open, high, low, close, volume, adjClose, symbol)',
			self.serializeHistoricalData(config.importId, config.data),
			function(err, res) {
				Log.info('Data was saved');
				config.insert = res;
				done(err, config);
			});
	};

	this.createImportId = function(config, done) {
		DB.insert("import_batch", {trigger: "robot"}, function(err, res) {
			if(!res) {
				Log.info(JSON.stringify(err, res));
				return done(err, res);
			}

			config.importId = res.insertId;
			done(err, config);
		});
	};

	this.downloadHistory = function(config, done) {
		var dateFrom = self.getWeekDaysInPast(addWeekends(_dataLen), config.date);
		var dateTo = self.getWeekDaysInPast(1, config.date);
		var tickers = "'"+config.tickers.join("','")+"'";

		Log.info("Reading history data from %s to %s", dateFrom, dateTo);

		if(config.internalHistory || config.internalHistorical)
			DB.getData("symbol, "+_PRICE_COLUMN_NAME+" as close, date", _DB_FULL_HISTORY_TABLE, "date >= ? AND date <= ? AND symbol IN ("+tickers+")", [dateFrom, dateTo], "date ASC", function(err, res) {
				if(err) return done(err, config);

				config.data = self.deserializeHistoricalData(res);
				done(err, config);
			});
		else
			Yahoo.historical({
				symbols: config.tickers,
				from: dateFrom,
				to: dateTo
			}, function(err, res) {
				config.data = res;
				done(err, config);
			});
	};

	this.markImportAsFinished = function(info, done) {
		Log.info('Marking import as finished');
		DB.update("import_batch", {result: 1, rows_imported: info.insert && info.insert.affectedRows}, "import_id = ?", info.importId, function(err, res) {
			done(err, info);
		});
	};

	this.printState = function(config, state) {
		Log.info(("Current: Date: "+self.getDate(config.date)+" Equity: "+ state.current_capital.toFixed(2)+ " Unused: "+ state.unused_capital.toFixed(2)).yellow);
	};

	this.saveCurrentState = function(config, done) {
		Log.info('Saving config to DB');

		self.printState(config, config.currentState);
		self.saveConfig(config.currentState, function(err, res){done(err, config)});
	};

	this.saveNewEquity = function(config, done) {
		Log.info('Saving new equity');

		var state = config.currentState;

		if(!config.positionsAggregated["SPY"] || !config.actual["SPY"])
			return done(null, config);


		var capital = state.unused_capital + config.positionsAggregated["SPY"].amount *  config.actual["SPY"][_PRICE_COLUMN_NAME];

		DB.insert("equity_history", {
			capital: capital,
			free_pieces: 0,
			unused_capital: state.unused_capital,
			import_id: config.importId,
			date: self.getDBDate(config.date)
		}, function(err, res) {done(err, config)});
	};

	this.getDBDate = function(d) {
		return d.format(_dateFormat);
	};

	this.getDate = function(d) {
		return d.format(_dateFormat);
	};

	this.sendOrders = function(config, done) {
		Log.info('Sending orders');

		config.currentState = {
			current_capital: parseFloat(config.settings.current_capital, 2),
			unused_capital: parseFloat(config.settings.unused_capital, 2)
		};
		config.changedPositions = 0;
		self.printState(config, config.currentState);

		async.series([
			function(done) {
				// =========== CLOSE POSITION process
				config.changedPositions += Object.keys(config.closePositions).length;

				async.each(Object.keys(config.closePositions), function(ticker, done) {
					var pos = config.closePositions[ticker];
					var indicators = config.indicators[ticker];
					Broker.sendSellOrder(ticker, pos.amount, "MKT", indicators.price, function(err, res) {
						if(err) {
							Log.error("Error during sell order", err.errorText || err.toString());
							return done(err.toString());
						}

						var finalPrice = res.price;
						var orderFee = 0;
						if(!config.feesDisabled && config.settings.fee_order_sell) {

							finalPrice -= (config.settings.fee_order_sell / pos.amount);
							orderFee = config.settings.fee_order_sell;
						}

						Log.info("CLOSE: ".red + pos.amount+ "x "+ pos.ticker+ " price "+ indicators.price+" PROFIT: "+ ((res.price - pos.open_price) * pos.amount).toFixed(2));

						DB.update("positions", {
							sell_import_id: config.importId,
							requested_close_price: indicators.price,
							close_price: finalPrice,
							close_price_without_fee: res.price,
							close_fee: orderFee,
							requested_close_date: self.getDBDate(config.date),
							close_date: self.getDBDate(config.date)
						}, "close_price IS NULL AND ticker = ?", pos.ticker, function(err, resDb) {
							if(err) {
								Log.error("Error while saving sold positions to DB", err);
								return done(err);
							}

							// decrement available resources
							// config.currentState.current_capital = parseFloat(finalPrice * res.amount) + config.currentState.unused_capital;
							// config.currentState.unused_capital = config.currentState.current_capital;
							done(err, res);
						});
					});
				}, done);
			},
			function(done) {
				// =========== OPEN POSITION process
				config.changedPositions += config.openPositions.length;

				// if this is the last day of the backtest - don't open new positions
				if(config.lastDay)
					return done(null);

				async.each(config.openPositions, function(pos, done) {
					var type = "OPEN: ";
					if(config.positionsAggregated[pos.ticker])
						type = "SCALE: ";

					Broker.sendBuyOrder(pos.ticker, pos.amount, "MKT", pos.requested_open_price, function(err, res) {
						if(err) {
							Log.error("Error during sell order", (err.errorText || err.toString()));
							return done(err.toString());
						}

						var finalPrice = res.price;
						var orderFee = 0;
						if(!config.feesDisabled && config.settings.fee_order_buy) {

							finalPrice += (config.settings.fee_order_buy / pos.amount);
							orderFee = config.settings.fee_order_buy;
						}

						Log.info(type.green + pos.amount + "x "+ pos.ticker+ " for "+ finalPrice);

						DB.insert("positions", {
							requested_open_price: pos.requested_open_price,
							buy_import_id: config.importId,
							ticker: pos.ticker,
							pieces: pos.pieces,
							amount: res.amount,
							open_price: finalPrice,
							open_fee: orderFee,
							open_price_without_fee: res.price,
							open_date: self.getDBDate(config.date)
						}, function(err, resDb) {
							if(err) {
								Log.error("Error while saving bought positions to DB", err);
								return done(err);
							}

							// lower available resources
							config.currentState.unused_capital -= finalPrice * res.amount; // remove money spent on BUY order
							done(err, res);
						});
					});
				}, done);
			}
		], function(err) {
			done(err, config);
		});
	};

	this.getHistoricalImport = function(info, done) {
		DB.getData("*", "stock_history", "import_id = ?", info.importId, "symbol ASC, date ASC", function(err, res) {
			done(err, info, self.deserializeHistoricalData(res));
		});
	};

	this.getImportById = function(id, done) {
		DB.get("*", "import_batch", "import_id = ?", id, "import_id DESC", done);
	};

	this.getLastImportId = function(done) {

		DB.get("import_id", "import_batch", "result = 1", null, "import_id DESC", done);
	};

	this.getLastImport = function(done) {
		async.waterfall([
			self.getLastImportId,
			self.getHistoricalImport
		], done);
	};

	this.processIndicators = function(config, done) {
		Log.info('Processing indicators');

		config.indicators = {};
		for(var index in config.tickers) {
			var ticker = config.tickers[index];
			if(!config.actual[ticker])
				continue;

			config.indicators[ticker] = {
				ticker: ticker,
				price: config.actual[ticker][_PRICE_COLUMN_NAME]
				// sma5: Indicators.sma(_smaExitLen, data),
				// sma200: Indicators.sma(_smaEntryLen, data),
				// rsi: Indicators.rsiWilders(_rsiLen, data),
				// 	// Vypočítej mi prosím RSI2 tickeru SPY k 1.8.2014, ukaž mi, jak Ti to vyšlo „přesně (ověřeno na freestockcharts)“ a pak se můžeme pohnout dál.
				// 	//Má vyjít 0.80.
				// 	// RSI2 = 0,807851951
 				// 	// viz: https://winpes.cz/chcete-system-s-90-uspenosti-obchodu/
			}
		}

		done(null, config);
	};

	this.appendActualPrices = function(config, done) {
		Log.info('Appending actual prices');
		for(var symbol in config.actual) {
			var item = config.actual[symbol];

			if(!config.data[symbol]) {
				Log.info(("Ticker("+symbol+") does not exists in data feed!").red);
				continue;
			}
			config.data[symbol].push(config.actual[symbol]);
		}

		delete config.actual;
		done(null, config);		
	};

	this.getActualPrices = function(config, done) {
		Log.info('Get actual prices');
		var date = moment(config.date).format(_dateFormat);
		var tickers = "'"+config.tickers.join("','")+"'";
		config.actual = {};

		function processApiResult(err, prices) {
			if(err) return done(err, config);

			_.forEach(prices, function(info, ticker) {
				config.actual[ticker] = {
					date: date,
					symbol: ticker,
					importId: config.importId,
					open: info.price,
					high: info.price,
					low: info.price,
					close: info.price,
					adjClose: info.price,
					volume: 0,
				};
			});
			done(err, config);
		}

		function processDBResult(err, res) {
			if(err) return done(err, config);
			
			res.forEach(function(item) {
				config.actual[item.symbol] = item;
			});

			done(err, config);
		}
		
		if(config.internalHistory && !config.disabledLoadingActualsFromDb)
			DB.getData("*", _DB_FULL_HISTORY_TABLE, "date = ? AND symbol IN ("+tickers+")", date, processDBResult);
		else
			Broker.getMarketPriceBulk(config.tickers, processApiResult);
	};

	this.getConfig = function(config, done) {
		Log.info('Retrieving config');
		DB.getData("*", "config", "1=1", function(err, res) {
			if(err) return done(err);

			config.settings = {};
			for(var i in res)
				config.settings[res[i]['var']] = res[i].val;

			done(err, config);
		});
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

	this.getOpenPositions = function(config, done) {
		Log.info('Selecting openned positions');
		DB.getData("*", "positions", "close_date IS null", null, "open_date ASC", function(err, res) {
			config.positions = self.deserializeOpenPositions(res);
			config.positionsAggregated = self.aggregatePositions(res);
			done(err, config);
		});
	};

	this.saveIndicators = function(config, done) {
		Log.info('Saving indicators');

		var buffer = [];
		Object.keys(config.indicators).forEach(function(ticker) {
			var item = _.toArray(config.indicators[ticker]);
			item.push(config.importId);
			buffer.push(item);
		});

		if(!buffer.length)
			return done(null, config);

		DB.insertValues("indicators (ticker, price, sma5, sma200, rsi14, import_id)", buffer, function(err, res) {
			done(err, config);
		});
	};
	
	this.isLastPriceEntry = function(ticker, config, done) {
		if(!config.internalHistory)
			return done(false);

		DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and symbol = ?", [config.date.format(), ticker], function(err, res) {
			if(err)
				throw err;
			done(!res);
		});
	};

	this.getAmountByCapital = function(capital, price) {
		return parseInt(capital/price);
	};

	this.filterBuyStocks = function(config, done) {
		Log.info('Filtering stocks for buy condition');

		var newPos = false;
		var ticker = config.tickers[0];
        config.openPositions = [];

		if(!config.actual[ticker]) {
			Log.warn("Cannot find current price for ticker %s", ticker);
			return done(null, config);
		}

		var tickerInfo = config.actual[ticker];
		var tickerPrice = tickerInfo[_PRICE_COLUMN_NAME];

		if(!config.positionsAggregated[ticker]) {

			Log.info("Ticker: "+ ticker+ " Price: " + tickerPrice);

			newPos = {
				ticker: ticker,
				pieces: 1,
				requested_open_price: tickerPrice,
				amount: self.getAmountByCapital(config.newState.unused_capital, tickerPrice),
				price: tickerPrice
			};

			config.openPositions.push(newPos);
			config.newState.unused_capital -= parseFloat(newPos.price * newPos.amount, 2);

		}
		done(null, config);
	};

	this.getPositionSummary = function(positions) {
		var out = {
			pieces: 0,
			price: 0,
			volume: 0
		};

		positions.forEach(function(pos) {

			if(!out.volume) {
				out.price = pos.open_price;
			}
			else
				out.price = (out.price * out.volume + pos.open_price * pos.amount) / ( out.volume + pos.amount);

			out.volume += pos.amount;
			out.pieces += pos.pieces;
		});

		return out;
	};

	this.filterSellStocks = function(config, done) {
        Log.info('Filtering stocks for sell condition');

        config.closePositions = {};
        config.newState = {
			current_capital: parseFloat(config.settings.current_capital, 2),
			unused_capital: parseFloat(config.settings.unused_capital, 2)
        };


		var ticker = config.tickers[0];

		// Pokud nejsou zadne otevrene pozice
		if(!config.actual[ticker] || ! Object.keys(config.positions).length) {
			return done(null, config);
		}
		var tickerInfo = config.actual[ticker];
		var tickerPrice = tickerInfo[_PRICE_COLUMN_NAME];

		async.each(Object.keys(config.positionsAggregated), function(ticker, done) {
			var pos = config.positionsAggregated[ticker];

			self.isLastPriceEntry(ticker, config, function(isLast) {

	        	// test for close condition
		        if(isLast) { // is openned and actual price > sma5
	        		if(isLast) Log.warn('Closing because %s has no more entries in DB'.yellow, ticker);
	        		// we will close this position
	        		config.closePositions[ticker] = pos;
	        		config.newState.unused_capital += parseFloat(tickerPrice * pos.amount, 2);
		        }

		        done(null);
			});
		}, function(err, res) {
			done(null, config);
		});
	};

	this.increaseCapital = function(config, inc, done) {
		
		self.getConfig(config, function(err, config) {
			config.settings.current_capital = inc + Number(config.settings.current_capital);
			config.settings.unused_capital = inc + Number(config.settings.unused_capital);
			self.saveConfig(config.settings, done);
		});
	};

	this.saveConfig = function(conf, done) {
		async.each(Object.keys(conf), function(i, done) {
			DB.update("config", {val: conf[i]}, "var=?", i,done);
		}, done);
	};

	this.initClear = function(config, done) {
		Log.info("Clearing before start");

		var initConf = {
			current_capital: config.capital || _INIT_CAPITAL,
			unused_capital: config.capital || _INIT_CAPITAL
		};

		async.parallel([
			function(done) {
				DB.delete("positions", "1=1", done);
			},
			function(done) {
				DB.delete("import_batch", "1=1", done);
			},
			function(done) {
				self.saveConfig(initConf, done);
			},
			function(done) {
				DB.delete("indicators", "1=1", done);
			},
			function(done) {
				DB.delete("equity_history", "1=1", done);
			}
		], done);
	};

	this.sendMailLog = function(config, res, done) {
		return done(null, res);
	};

	this.init = function(config, done) {
		console.time("Initing strategy");

		// return done(null, config);
		async.waterfall([
			self.createImportId.bind(null, config),
		// 	function(config, done) {
		// 		async.parallel({
		// 			clear: self.clearPreviousData.bind(null, config),
		// 			tickers: self.queryTickers.bind(null, config)
		// 		},done);
		// 	},
		// 	self.processTickers.bind(null, config),
		// 	self.downloadHistory,
		// 	self.saveData,
		// 	self.markImportAsFinished,
		// 	self.startStreamingPrices,
		], done);
	};

	this.process = function(config, done) {

		async.waterfall([
			self.getConfig.bind(null, config),
			self.getOpenPositions,
			self.getActualPrices,
			// self.appendActualPrices,
			// self.stopStreamingPrices,
			self.processIndicators,
			// self.saveIndicators,
			self.filterSellStocks,
			self.filterBuyStocks,
			self.sendOrders,
			self.saveCurrentState,
			self.saveNewEquity
		], function(err, res) {
			if(err)
				Log.error("Strategy finished with an error", err);

			self.sendMailLog(config, res, _.noop);
			done(err, res);
		});
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};