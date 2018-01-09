"use strict";

const _ = require('lodash');
const moment = require('moment');
const async = require('async');
const HistoryService = require('../Core/History');

var Strategy = function(app) {
	var self = this;
	var DB = app.DB;
	var Log = app.getLogger("STRATEGY");
	var MemLog = app.memLogger;

	var config = _.defaults(app.config, {

		// rsi - scale when rsi2 < 10
		// lower - scale when price is lower than previous openPrice
		scaleStrategy: "rsi" // lower, lowerThanFirst
	});

	this.config = config;

	console.log("Using scale strategy: %s, allowed are [rsi, lower]", config.scaleStrategy);
	if(config.scaleStrategy === "lower") {
		if(config.scaleStrategyLowerDiff)
			console.log('Using configuration for lower scale strategy minDiff = %d', config.scaleStrategyLowerDiff)
	}
	// modules
	var Indicators = require(config.dirCore+'./Indicators');
	var Tickers = require(config.dirLoader+'./Tickers');

	if(!config.disabledOrders)
		var Broker = require(config.dirCore+"OrderManager")(app);

	const History = new HistoryService(app);

	// settings
	var _PRICE_COLUMN_NAME = 'adjClose';
	var _INIT_FREE_PIECES = 20;
	var _INIT_CAPITAL = 20000;
	var _CLEAR_DATA_TTL = 20;
	var _DB_FULL_HISTORY_TABLE = "stock_history_full";
	// var _DB_FULL_HISTORY_TABLE = "stock_history_full_quandl";
	var _dateFormat = "YYYY-MM-DD";
	var _smaEntryLen = 200;
	var _smaExitLen = 5;
	var _maxPositionSize = 10; // 1 + 2 + 3 + 4 = 10 (max 2 fully loaded stocks will be bought)
	var _rsiLen	= 2;
	var _minRSI	= 10;
	var _dataLen = _smaEntryLen;


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

	this.queryTickers = function(config, done) {
		if(config.tickers) return done(null, null);
		DB.getData('*', 'watchlist', 'active = 1', done);
	};

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
		const importData = [];
		Object.keys(data).forEach(ticker => {
			if (!data[ticker]) return;
			for(const item of data[ticker])
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
		});

		return importData;
	};
	
	this.deserializeHistoricalData = function(data) {
		const out = {};

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
		const barCount = _dataLen;
    const dateTo = self.getWeekDaysInPast(1, config.date);
    Log.info("Reading %d last days of history data from date %s ", barCount, dateTo);

		if(config.internalHistory || config.internalHistorical) {
      const tickers = "'"+config.tickers.join("','")+"'";
      const dateFrom = self.getWeekDaysInPast(addWeekends(barCount) + 20, config.date);
	    DB.getData("symbol, "+_PRICE_COLUMN_NAME+" as close, date", _DB_FULL_HISTORY_TABLE, "date >= ? AND date <= ? AND symbol IN ("+tickers+")", [dateFrom, dateTo], "date ASC", function(err, res) {
				if(err) return done(err, config);

				config.data = self.deserializeHistoricalData(res);
				done(err, config);
			});
		} else
      History.getHistoryMultiple(config.tickers, dateTo, barCount)
				.then((data) => {
          config.data = data;
          done(null, config)
				})
				.catch(err => done(err));
	};

  this.saveData = function(config, done) {
    Log.info("Saving data for "+ Object.keys(config.data).length +" tickers");

    if(config.internalHistory) {
      Log.info('Saving data - Using internal history so nothing was saved');
      return done(null, config);
    }

    const serializedData = self.serializeHistoricalData(config.importId, config.data);
    if(!serializedData.length) {
      Log.error('No historical data were loaded')
      Log.debug('Historical data:', config.data)
      return done('No historical data given')
    }

    DB.insertValues(
      'stock_history (import_id, date, open, high, low, close, volume, adjClose, symbol)',
      serializedData,
      function(err, res) {
        if(err) return done(err)
        Log.info('Historical data was saved');
        config.insert = res;
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
		Log.info(("Current: Date: "+self.getDBDate(config.date)+" Equity: "+ state.current_capital.toFixed(2)+ " Unused: "+ state.unused_capital.toFixed(2)+ " Free pieces: "+ state.free_pieces).yellow);
	}

	this.saveCurrentState = function(config, done) {
		Log.info('Saving config to DB');

		self.printState(config, config.currentState);
		config.newState = config.currentState;
		self.saveConfig(config.currentState, function(err, res){done(err, config)});
	};

	this.saveNewEquity = function(config, done) {
		var date = self.getDBDate(config.date);
		Log.info('Saving new equity with date '+date);

		var state = config.currentState;

		// dont save when there are no changes in positions
		// if(!config.changedPositions)
		// 	return done(null, config);

		DB.insert("equity_history", {
			capital: state.current_capital,
			free_pieces: state.free_pieces,
			unused_capital: state.unused_capital,
			import_id: config.importId,
			date: date
		}, function(err) {done(err, config)});
	};

	this.getDBDate = function(d) {
		return d.format(_dateFormat)+moment().format(' HH:mm:ss');
	};

	this.closePositions = function(config, done) {
		// =========== CLOSE POSITION process
		config.changedPositions += Object.keys(config.closePositions).length;

		async.each(Object.keys(config.closePositions), function(ticker, done) {
			var pos = config.closePositions[ticker];
			var indicators = config.indicators[ticker];

			Broker.sendSellOrder(ticker, pos.amount, "MKT", indicators.price, function(err, res) {

				if(err && err.codeName === 'timeout') {
					Log.error("Timeout during sell order", err.errorText || err.toString());

					// this will disable new open/scale orders
					config.disableOrders = true;
					return done(null, err);

				} else if(err) {
					Log.error("Error during sell order", err.errorText || err.toString());
					return done(err.toString());
				}

				var finalPrice = res.price;
				var orderFee = 0;
				if(!config.feesDisabled && config.settings.fee_order_sell) {

					finalPrice -= (config.settings.fee_order_sell / pos.amount);
					orderFee = config.settings.fee_order_sell;
				}

				Log.info("CLOSE: ".red + pos.amount+ "x "+ pos.ticker+ " price "+ indicators.price+ " > SMA5 "+ indicators.sma5.toFixed(2) +" PROFIT: "+ ((res.price - pos.open_price) * pos.amount).toFixed(2));

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

					config.log.orders.push({
						type: "C",
						ticker: pos.ticker,
						amount: pos.amount
					});

					// decrement available resources
					config.currentState.current_capital += parseFloat(finalPrice * res.amount - pos.open_price * pos.amount, 2); // current_capital - add profit/loss
					config.currentState.unused_capital += parseFloat(finalPrice * res.amount, 2); // add to unused_capital received money from SELL order
					config.currentState.free_pieces += pos.pieces;
					done(err, res);
				});
			});
		}, done);
	};

	this.openPositions = function(config, done) {

		if(config.disableOrders) {
			Log.error('There was a problem when closing orders - open/scale orders were disabled'.red);
			return done(null, 1)
		}

		// =========== OPEN POSITION process
		config.changedPositions += config.openPositions.length;

		// if this is the last day of the backtest - don't open new positions
		if(config.lastDay)
			return done(null);

		async.each(config.openPositions, function(pos, done) {
			var type = "OPEN";
			if(config.positionsAggregated[pos.ticker])
				type = "SCALE";

			Broker.sendBuyOrder(pos.ticker, pos.amount, "MKT", pos.requested_open_price, function(err, res) {
				if(err && err.codeName == 'timeout') {
					Log.error("Timeout during buy order", (err.errorText || err.toString()));
					return done(null, err);
				} else if(err) {
					Log.error("Error during buy order", (err.errorText || err.toString()));
					return done(err.toString());
				}

				var finalPrice = res.price;
				var orderFee = 0;
				if(!config.feesDisabled && config.settings.fee_order_buy) {

					finalPrice += (config.settings.fee_order_buy / pos.amount);
					orderFee = config.settings.fee_order_buy;
				}

				Log.info((type+': ').green + pos.amount + "x "+ pos.ticker+ " for "+ finalPrice+ " with rsi: "+ pos.rsi.toFixed(2));

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
				}, function(err) {
					if(err) {
						Log.error("Error while saving bought positions to DB", err);
						return done(err);
					}

					config.log.orders.push({
						type: type == "OPEN" ? "O" : "S",
						ticker: pos.ticker,
						amount: pos.amount
					});

					// lower available resources
					config.currentState.unused_capital -= finalPrice * res.amount; // remove money spent on BUY order
					config.currentState.free_pieces -= pos.pieces;	// remove spent pieces
					done(err, res);
				});
			});
		}, done);
	};

	this.sendOrders = function(config, done) {
		Log.info('Sending orders');

		config.currentState = {
			current_capital: parseFloat(config.settings.current_capital, 2),
			unused_capital: parseFloat(config.settings.unused_capital, 2),
			free_pieces: parseInt(config.settings.free_pieces)
		};

		config.log = {
			orders: [],
			capitalStart: config.currentState.current_capital,
			capitalEnd: 0,
			capitalDiff: 0
		};

		config.changedPositions = 0;
		self.printState(config, config.currentState);

		async.series([
			function(done) {
				self.closePositions(config, done);
			},
			function(done) {
				self.openPositions(config, done);
			}
		], function(err) {

			config.log.capitalEnd = config.currentState.current_capital;
			config.log.capitalDiff = (config.log.capitalEnd - config.log.capitalStart).toFixed(2);
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
		for(var ticker in config.data) {
			var data = config.data[ticker];

			config.indicators[ticker] = {
				ticker: ticker,
				price: parseFloat(data[0].close),
				sma5: Indicators.sma(_smaExitLen, data),
				sma200: Indicators.sma(_smaEntryLen, data),
				rsi: Indicators.rsiWilders(_rsiLen, data),
			};

			if(!config.indicators[ticker].sma200 || !config.indicators[ticker].rsi) {
				Log.error('Error while processing indicators for %s with data length %d', ticker, data.length);
				delete config.data[ticker];
				delete config.indicators[ticker];
			}
		}

		done(null, config);
	};

	this.appendActualPrices = function(config, done) {
		Log.info('Appending actual prices');
		for(const symbol in config.actual) {
			if(!config.data[symbol]) {
				Log.info(("Ticker("+symbol+") does not exists in data feed!").red);
				continue;
			}
			config.data[symbol].unshift(config.actual[symbol]);
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
			DB.getData("*, "+_PRICE_COLUMN_NAME+' as close', _DB_FULL_HISTORY_TABLE, "date = ? AND symbol IN ("+tickers+")", date, processDBResult);
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

			config.disableOrders = false;
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
				out[item.ticker] = _.clone(item);
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
			item.push(config.date.format("YYYY-MM-DD HH:mm:ss"));
			buffer.push(item);
		});

		if(!buffer.length)
			return done(null, config);

		DB.insertValues("indicators (ticker, price, sma5, sma200, rsi14, import_id, date)", buffer, function(err, res) {
			done(err, config);
		});
	};
	
	this.isLastPriceEntry = function(symbol, config, done) {
		if(!config.internalHistory)
			return done(false);

		DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and symbol = ?", [config.date.format(), symbol], function(err, res) {
			if(err)
				throw err;
			done(!res);
		});
	};

	this.getStockForBuy = function(config) {
		Log.info('Filtering stocks for buy condition');

		var stocksToBuy = [];
		var piecesCapital = config.newState.unused_capital / config.newState.free_pieces;
		if(config.sellAll)
			return stocksToBuy;

		// vyber akcie co maji RSI pod 10
		for(var ticker in config.indicators) {
			var item = config.indicators[ticker];
			var isOpenedPosition = !!config.positionsAggregated[ticker];

			// don't buy if:
			// - we do not have enough capital pieces
			// - stock will be sold in the same run
      if(item.price > piecesCapital || config.closePositions[ticker])
      	continue;

      // first buy is when the stock goes under RSI 10 and above SMA 200
			if(!isOpenedPosition) {
        if(item.rsi < _minRSI && item.sma200 && item.price > item.sma200) {
          stocksToBuy.push(item);
					continue;

				} else {
					// if we don't hold this stock and it does not match required indicators
					// than skip it
					continue;
				}
			}

			// handle scaling based on the selected strategy
			// - rsi - scale when RSI < 10
			// - lower - when price is lower then last buy price
			// - lower with diff - when price is lower at least N% then last buy price
			if(self.config.scaleStrategy === 'rsi') {
				if(item.rsi <= _minRSI)
					stocksToBuy.push(item);

			} else if (self.config.scaleStrategy  === "lower") {
				var pos = config.positions[ticker];
				var lastOpenPrice = pos[pos.length - 1].open_price;
				var diffValid = item.price < lastOpenPrice;

				if(self.config.scaleStrategyLowerDiff) {
					const diff = item.price - lastOpenPrice;
					const diffPercent = Math.abs(diff / lastOpenPrice * 100);

					diffValid = diff < 0 && diffPercent >= self.config.scaleStrategyLowerDiff;
				}

				if(diffValid)
					stocksToBuy.push(item);
			}
		}

		// sort buy candidates by RSI
		stocksToBuy.sort(function(a, b) {
			return (a.rsi > b.rsi) ? 1 : -1;
		});

		stocksToBuy.forEach(function(item) {
			Log.info("BuyFilter::Ticker: "+ item.ticker+ " | RSI: " + item.rsi.toFixed(2) + " | Price: " + item.price + " | Sma200: "+ item.sma200.toFixed(2) + " | Sma5: "+ item.sma5.toFixed(2));
		});

		return stocksToBuy;
	};

	this.getCapitalByPiece = function(info, pieces) {
		return info.unused_capital /info.free_pieces * pieces;
	};

	this.getAmountByCapital = function(capital, price) {
		return parseInt(capital/price);
	};

	this.filterBuyStocks = function(config, done) {

		var item;
		var newScalePosition = false;
		var newPos = false;
		var newBuyPosition = false;
		var opennedPositions = 0;
		var opennedFirstRSI = 0;
        config.openPositions = [];
		
		// jestlize nejsou dilky na prikupovani
		if(!config.newState.free_pieces) {
			Log.warn("There are no more free pieces for buy stocks");
			return done(null, config);
		}

		var stocksToBuy = self.getStockForBuy(config);

		if(stocksToBuy.length)
			Log.info('Selecting stock to buy');

		for(var i in stocksToBuy) {
			item = stocksToBuy[i];

			if(!config.newState.free_pieces) {
				Log.warn("Ending buy selection loop - not enought free pieces");
				return done(null, config);
			}

			// ============== OPEN STRATEGIE 5 ===============
			// scale everything but buy only one new stock
			// var posHeld = Object.keys(config.positionsAggregated).length;
			// if((newBuyPosition || posHeld > 4) && !config.positionsAggregated[item.ticker])
			// 	continue;
      //
			// if(!config.positionsAggregated[item.ticker])
			// 	newBuyPosition = true;
			//
			// ============== OPEN STRATEGIE 4 ===============
			// scale all but open max two new stocks only if there are not so many positions
			// if(opennedPositions && !config.positionsAggregated[item.ticker]) {
      //
			// 	var posHeld = Object.keys(config.positionsAggregated).length;
			// 	if(opennedPositions >= 2 || (opennedPositions >= 1 && posHeld >= 3)) continue;
      //
			// 	if(opennedPositions == 1 && (item.rsi - opennedFirstRSI > 0.5 || item.rsi > 1)) {
			// 		continue;
			// 	}
			// }
      //
			// if(!config.positionsAggregated[item.ticker]) {
			// 	opennedPositions++;
			// 	opennedFirstRSI = item.rsi;
			// }


			// ============== OPEN STRATEGIE 3 ===============
			// scale all but open max two new stocks
			// if(opennedPositions && !config.positionsAggregated[item.ticker]) {
			// 	if(opennedPositions >= 2) continue;
      //
			// 	if(opennedPositions == 1 && (item.rsi - opennedFirstRSI > 0.5 || item.rsi > 1)) {
			// 		continue;
			// 	}
			// }
      //
			// if(!config.positionsAggregated[item.ticker]) {
			// 	opennedPositions++;
			// 	opennedFirstRSI = item.rsi;
			// }

			// ============== OPEN STRATEGIE 2===============
			// scale everything but buy only one new stock
			if(newBuyPosition && !config.positionsAggregated[item.ticker])
				continue;

			// ============== OPEN STRATEGIE 1 ===============
			// buy and scale only one stock per day
			// if((newBuyPosition && !config.positionsAggregated[item.ticker]) || (newScalePosition && config.positionsAggregated[item.ticker]))
			// 	continue;


			// ============ LOG ORDER =============
			if(!config.positionsAggregated[item.ticker])
				newBuyPosition = true;

			if(config.positionsAggregated[item.ticker])
				newScalePosition = true;


			Log.info("Ticker: "+ item.ticker+ " RSI: " + item.rsi.toFixed(2) + " Price: " + item.price + " Sma200: "+ item.sma200.toFixed(2) + " Sma5: "+ item.sma5.toFixed(2));

			// jestlize akcii uz drzime, naskaluj ji
			if(config.positionsAggregated[item.ticker]) {
				var position = config.positionsAggregated[item.ticker];

				if(position.pieces >= _maxPositionSize) {
					Log.info("Stock "+ item.ticker + " is on max "+ position.pieces + " pieces .. selecting another stock", true);
					continue;
				}

				var piecesCount = self.getNextPiecesCount(position.pieces);
				Log.info("Scaling up "+ item.ticker +" +"+piecesCount+" pieces (actual: "+position.pieces+")", true);

				if(piecesCount > config.newState.free_pieces) {
					Log.info("Not enought free pieces".red, true);
					// piecesCount = config.newState.free_pieces;
					continue;
				}

				newPos = {
					ticker: item.ticker,
					pieces: piecesCount,
					requested_open_price: item.price,
					amount: self.getAmountByCapital(self.getCapitalByPiece(config.newState, piecesCount), item.price),
					price: item.price,
					rsi: item.rsi
				};
			} else {
				newPos = {
					ticker: item.ticker,
					pieces: 1,
					requested_open_price: item.price,
					amount: self.getAmountByCapital(self.getCapitalByPiece(config.newState, 1), item.price),
					price: item.price,
					rsi: item.rsi
				};
			}

			config.openPositions.push(newPos);
			
			config.newState.free_pieces -= parseFloat(newPos.pieces, 2);
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
			unused_capital: parseFloat(config.settings.unused_capital, 2),
			free_pieces: parseInt(config.settings.free_pieces),
		};

		// Pokud nejsou zadne otevrene pozice
		if(! Object.keys(config.positions).length) {
			return done(null, config);
		}

		async.each(Object.keys(config.positionsAggregated), function(ticker, done) {
			var pos = config.positionsAggregated[ticker];
			var indicators = config.indicators[ticker];
			
			self.isLastPriceEntry(ticker, config, function(isLast) {

				// test for close condition
				// first test if indicators are present (can be skipped when stock is disabled or there was some error in datafeed)
				if(indicators && indicators.price > indicators.sma5 || isLast || config.sellAll) { // is openned and actual price > sma5
					if(isLast) Log.warn('Closing because %s has no more entries in DB'.yellow, ticker);
					// we will close this position
					config.closePositions[ticker] = pos;
					config.newState.unused_capital += parseFloat(indicators.price * pos.amount, 2);
					config.newState.free_pieces += pos.pieces;
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
			unused_capital: config.capital || _INIT_CAPITAL,
		  	free_pieces: _INIT_FREE_PIECES
		};

		async.parallel([
			function(done) {
				DB.delete("transfers", "1=1", done);
			},
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
		var buffer = MemLog.getBuffer().join("\n<br />");
		MemLog.flushBuffer();

		app.mailer.sendDailyLog(buffer);
		return done(null, res);
	};

	this.sendSmsLog = function(err, config) {
		var text = [
			config.date.format("D.M"),
			err ? 'NOK' : 'OK',
			config.log.capitalDiff
		].join(';');

		text += ";"+config.log.orders.map(function(order) {
			return order.type+order.amount+"x"+order.ticker;
		}).join(";");

		app.mailer.sendDailySmsLog(text);
	};

	this.startStreamingPrices = function (config, done) {
		if(config.internalHistory && !config.disabledLoadingActualsFromDb) {

			done(null, config);
		} else {

			Broker.startStreaming(config.tickers, function () {
				done(null, config);
			});
		}
	};

	this.stopStreamingPrices = function (config, done) {
		if(config.internalHistory && !config.disabledLoadingActualsFromDb) {
			// using internal history so no streaming
			done(null, config);
		} else {
			Broker.stopStreaming(function () {
				done(null, config);
			});
		}
	};

	this.init = function(config, done) {
		console.time("Downloaded historical data");
		MemLog.flushBuffer();

		async.waterfall([
			self.createImportId.bind(null, config),
			function(config, done) {
				async.parallel({
					clear: self.clearPreviousData.bind(null, config),
					tickers: self.queryTickers.bind(null, config)
				},done);
			},
			self.processTickers.bind(null, config),
			self.downloadHistory,
			self.saveData,
			self.markImportAsFinished,
			self.startStreamingPrices,
		], done);
	};

	this.process = function(config, done) {

		async.waterfall([
			self.getConfig.bind(null, config),
			self.getOpenPositions,
			self.getActualPrices,
			self.appendActualPrices,
			self.stopStreamingPrices,
			self.processIndicators,
			self.saveIndicators,
			self.filterSellStocks,
			self.filterBuyStocks,
			self.sendOrders,
			self.saveCurrentState,
			self.saveNewEquity
		], function(err, res) {
			if(err)
				Log.error("Strategy finished with an error", err);

			self.sendMailLog(config, res, _.noop);
			self.sendSmsLog(err, config);
			done(err, res);
		});
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};
