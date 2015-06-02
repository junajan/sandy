var _ = require('lodash');
var moment = require('moment');
var ydl = require('./HistYahoo');
var Indicators = require('./Indicators');
var async = require('async');

var Strategy = function(app) {
	var self = this;
	var DB = app.get("db");
	var Tickers = require('./Tickers');
	var Yahoo = require('./HistYahoo');

	var _INIT_CAPITAL = 20000;
	var _DB_FULL_HISTORY_TABLE = "stock_history_full";
	var _dateFormat = "YYYY-MM-DD";
	var _smaEntryLen = 200;
	var _smaExitLen = 5;
	var _maxPositionSize = 10; // 1 + 2 + 3 + 4 = 10 (max 2 fully loaded stocks will be bought)
	var _rsiLen	= 2;
	var _minRSI	= 10;
	var _rsiWildersLen	= 2;
	var _dataLen = _smaEntryLen + app.get("conf").dateOffset;

	function addWeekends(count) {
		return Math.floor(count / 5 * 7);
	};

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
		// console.log("Removing previous data imports");

		if(config.dontPersist) return done(null, 1);
		DB.delete("stock_history", "import_id < (SELECT MAX(import_id) FROM import_batch) - 3", done);
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
					item.symbol,
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
		console.log("Saving data for ", Object.keys(config.data).length, " tickers");

		if(config.internalHistory) {
			return done(null, config);
		}
		
		DB.insertValues(
			'stock_history (import_id, date, open, high, low, close, volume, adjClose, symbol)',
			self.serializeHistoricalData(config.importId, info.data),
			function(err, res) {
				config.insert = res;
				done(err, config);
			});
	};

	this.saveActualPrices = function(config, done) {
		var data = [];
		
		if(config.internalHistory)
			return done(null, config);

		for(var i in config.actual)
			data.push([i, config.actual[i].close, config.importId]);	

		console.log("Saving actual prices for ", data.length, " tickers");
		DB.insertValues('stock_actual (symbol, price, import_id) ', data, function(err, res) {
			done(err, config);
		});
	};

	this.createImportId = function(config, done) {
		DB.insert("import_batch", {trigger: "robot"}, function(err, res) {
			if(!res) {
				console.log(err, res);
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

		// console.log("Reading history data from "+dateFrom +" to " + dateTo);

		if(config.internalHistory)
			DB.getData("*", _DB_FULL_HISTORY_TABLE, "date >= ? AND date <= ? AND symbol IN ("+tickers+")", [dateFrom, dateTo], "date ASC", function(err, res) {
				if(err) return done(err, config);
				
				config.data = self.deserializeHistoricalData(res);
				done(err, config);
			});
		else
			ydl.historical({
				symbols: config.tickers,
				from: dateFrom,
				to: dateTo
			}, function(err, res) {
				config.data = res;
				done(err, config);
			});
	};

	this.markImportAsFinished = function(info, done) {
		DB.update("import_batch", {result: 1, rows_imported: info.insert && info.insert.affectedRows}, "import_id = ?", info.importId, function(err, res) {
			done(err, info);
		});
	};

	this.sendInteractiveBrokersOrders = function(config, done) {
		done(null, 1234);
	};

	this.printState = function(config, state) {
		console.log(("Current: Date: "+self.getDate(config.date)+" Equity: "+ state.current_capital.toFixed(2)+ " Unused: "+ state.unused_capital.toFixed(2)+ " Free pieces: "+ state.free_pieces).yellow);
	}

	this.saveCurrentState = function(config, done) {
		self.printState(config, config.currentState);
		self.saveConfig(config.currentState, function(err, res){done(err, config)});
	};

	this.saveNewEquity = function(config, done) {
		var state = config.currentState;

		// dont save when there are no changes in positions
		if(!config.changedPositions)
			return done(null, config);

		DB.insert("equity_history", {
			capital: state.current_capital,
			free_pieces: state.free_pieces,
			unused_capital: state.unused_capital,
			import_id: config.importId,
			date: self.getTimeDate(config.date)
		}, function(err, res) {done(err, config)});
	};

	this.getTimeDate = function(d) {
		return d.toISOString();
	};

	this.getDate = function(d) {
		return d.format(_dateFormat);
	};

	this.sendBacktestOrders = function(config, done) {
        config.currentState = {
			current_capital: parseFloat(config.settings.current_capital, 2),
			unused_capital: parseFloat(config.settings.unused_capital, 2),
			free_pieces: parseInt(config.settings.free_pieces),
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
					// console.log(pos);
					// console.log(indicators);
					console.log("CLOSE: ".red + pos.amount+ "x "+ pos.ticker+ " price "+ indicators.price+ " > SMA5 "+ indicators.sma5.toFixed(2) +" PROFIT: "+ ((indicators.price - pos.open_price) * pos.amount).toFixed(2));

					DB.update("positions", {
						sell_import_id: config.importId,
						requested_close_price: indicators.price,
						close_price: indicators.price,
						requested_close_date: self.getTimeDate(config.date),
						close_date: self.getTimeDate(config.date)
					}, "close_price IS NULL AND ticker = ?", pos.ticker, function(err, res) {

						// decrement available resources
						config.currentState.current_capital += parseFloat(indicators.price * pos.amount - pos.open_price * pos.amount, 2);
						config.currentState.unused_capital += parseFloat(indicators.price * pos.amount, 2);
						config.currentState.free_pieces += pos.pieces;
						done(err, res);
					});

				}, done);
			},
			function(done) {
				// =========== OPEN POSITION process
				config.changedPositions += config.openPositions.length;

				async.each(config.openPositions, function(pos, done) {
					console.log("OPEN: ".green + pos.amount + "x "+ pos.ticker+ " for "+ pos.price+ " with rsi: "+ pos.rsi.toFixed(2));
					DB.insert("positions", {
						requested_open_price: pos.requested_open_price,
						buy_import_id: config.importId,
						ticker: pos.ticker,
						pieces: pos.pieces,
						amount: pos.amount,
						open_price: pos.requested_open_price,
						open_date: self.getTimeDate(config.date)
					}, function(err, res) {

						// decrement available resources
						config.currentState.unused_capital -= pos.requested_open_price * pos.amount;
						config.currentState.free_pieces -= pos.pieces;
						done(err, res);
					});
				}, done);
			}
		], function(err, res) {
			done(err, config);
		});
	};

	this.pickBestStocks = function(data, done) {
		done(null, 3234);
	};

	this.sendOrders = function(config, done) {
		if(config.backtest)
			self.sendBacktestOrders(config, done);
		else
			self.sendInteractiveBrokersOrders(config, done);
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

		DB.get("*", "import_batch", "result = 1", null, "import_id DESC", done);
	};

	this.getLastImport = function(done) {
		async.waterfall([
			self.getLastImportId,
			self.getHistoricalImport
		], done);
	};

	this.processIndicators = function(config, done) {
		config.indicators = {};
		for(var ticker in config.data) {
			var data = config.data[ticker];

			config.indicators[ticker] = {
				ticker: ticker,
				price: parseFloat(data[data.length-1].close),
				sma5: Indicators.sma(_smaExitLen, data),
				sma200: Indicators.sma(_smaEntryLen, data),
				rsi: Indicators.rsiWilders(_rsiLen, data),
					// Vypočítej mi prosím RSI2 tickeru SPY k 1.8.2014, ukaž mi, jak Ti to vyšlo „přesně (ověřeno na freestockcharts)“ a pak se můžeme pohnout dál.
					//Má vyjít 0.80.
					// RSI2 = 0,807851951
 					// viz: https://winpes.cz/chcete-system-s-90-uspenosti-obchodu/
			}

			if(config.indicators[ticker].rsi === false) {
				delete config.data[ticker];
				delete config.indicators[ticker];
			}
		}

		done(null, config);
	};

	this.appendActualPrices = function(config, done) {
		for(var symbol in config.actual) {
			var item = config.actual[symbol];

			if(!config.data[symbol]) {
				console.log(("Ticker("+symbol+") does not exists in data feed!").red);
				continue;
			}
			config.data[symbol].push(config.actual[symbol]);
		}

		delete config.actual;
		done(null, config);		
	};

	this.getActualPrices = function(config, done) {
		var date = moment(config.date).format(_dateFormat);
		var tickers = "'"+config.tickers.join("','")+"'";
		config.actual = {};

		function processYahooResult(err, res) {
			if(err) return done(err, config);

			res.forEach(function(item) {
				config.actual[item[0]] = {
					date: date,
					symbol: item[0],
					importId: config.importId,
					open: item[1],
					high: item[1],
					low: item[1],
					close: item[1],
					adjClose: item[1],
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
		
		if(config.internalHistory)
			DB.getData("*", _DB_FULL_HISTORY_TABLE, "date = ? AND symbol IN ("+tickers+")", date, processDBResult);
		else
			Yahoo.actual(config.tickers, processYahooResult);
	};

	this.getConfig = function(config, done) {
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
		DB.getData("*", "positions", "close_date IS null", null, "open_date ASC", function(err, res) {
			config.positions = self.deserializeOpenPositions(res);
			config.positionsAggregated = self.aggregatePositions(res);
			done(err, config);
		});
	};

	this.saveIndicators = function(config, done) {

		var buffer = [];
		Object.keys(config.indicators).forEach(function(ticker) {
			var item = _.toArray(config.indicators[ticker]);
			item.push(config.importId);
			buffer.push(item);
		});

		DB.insertValues("indicators (ticker, price, sma5, sma200, rsi14, import_id)", buffer, function(err, res) {
			done(err, config);
		});
	};
	
	this.isLastPriceEntry = function(ticker, date, done) {
		DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and symbol = ?", [date.format(), ticker], function(err, res) {
			if(err)
				throw err;
			done(!res);
		});
	};

	this.getStockForBuy = function(config) {
		var stocks = [];
		var piecesCapital = config.newState.unused_capital / config.newState.free_pieces;

		// vyber akcie co maji RSI pod 10
		for(var ticker in config.indicators) {
			var item = config.indicators[ticker];
			// console.log(("Ticker: "+ item.ticker+ " RSI10: " + item.rsi + " Price: " + item.price + " Sma200: "+ item.sma200+ " Sma5: "+ item.sma5).green);
			if(item.price <= piecesCapital && item.rsi > 0 && item.rsi <= _minRSI && item.price < item.sma5 && !config.closePositions[ticker]) {
				if(config.positionsAggregated[ticker] || (item.sma200 && item.price > item.sma200))
					stocks.push(item);
			}
		};

		// serad je podle RSI
		stocks.sort(function(a, b) {
			return (a.rsi > b.rsi) ? 1 : -1;
		});
		return stocks;
	};

	this.getCapitalByPiece = function(info, pieces) {
		return info.unused_capital /info.free_pieces * pieces;
	};

	this.getAmountByCapital = function(capital, price) {
		return parseInt(capital/price);
	};

    this.getNextPiecesCount = function(c) {
        if(!c) return 1;
		if(c == 1) return 2;
		if(c == 3) return 3;
		if(c == 6) return 4;

		throw "Err - not defined pieces count";
 	};

	this.filterBuyStocks = function(config, done) {
		var item;
		var stocksToBuy = [];
		var newBuyPosition = false;
		var newScalePosition = false;
		var newPos = false;
        config.openPositions = [];
		
		// jestlize nejsou dilky na prikupovani
		if(!config.newState.free_pieces) {
			console.log("There are no more free pieces for buy stocks");
			return done(null, config);
		}

		stocksToBuy = self.getStockForBuy(config);
		for(var i in stocksToBuy) {
			item = stocksToBuy[i];

			if(!config.newState.free_pieces) {
				console.log("Ending buy selection loop - not enought free pieces");
				return done(null, config);
			}

			// otevira se jen jedna nova pozice za den
			if((newBuyPosition && !config.positionsAggregated[item.ticker]) || (newScalePosition && config.positionsAggregated[item.ticker]))
				continue;

			if(!config.positionsAggregated[item.ticker])
				newBuyPosition = true;

			if(config.positionsAggregated[item.ticker])
				newScalePosition = true;


			console.log("Ticker: "+ item.ticker+ " RSI: " + item.rsi.toFixed(2) + " Price: " + item.price + " Sma200: "+ item.sma200.toFixed(2) + " Sma5: "+ item.sma5.toFixed(2));

			// jestlize akcii uz drzime, naskaluj ji
			if(config.positionsAggregated[item.ticker]) {
				var position = config.positionsAggregated[item.ticker];

				if(position.pieces >= _maxPositionSize) {
					console.log("Stock "+ item.ticker + " is on max "+ position.pieces + " pieces .. selecting another stock");
					return done(null, config);
				}

				var piecesCount = self.getNextPiecesCount(position.pieces);
				console.log("Scaling up "+ item.ticker +" +"+piecesCount+" pieces (actual: "+position.pieces+")");

				if(piecesCount > config.newState.free_pieces) {
					console.log("Not enought free pieces".red);
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
			volume: 0,
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
			
			self.isLastPriceEntry(ticker, config.date, function(isLast) {

	        	// test for close condition
		        if(indicators.price > indicators.sma5 || isLast) { // is openned and actual price > sma5
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

	this.saveConfig = function(conf, done) {
		async.each(Object.keys(conf), function(i, done) {
			DB.update("config", {val: conf[i]}, "var=?", i,done);
		}, done);
	};

	this.initClear = function(done) {
		console.log("Clearing before start");

		var initConf = {
			current_capital: _INIT_CAPITAL,
		  	unused_capital: _INIT_CAPITAL,
		  	free_pieces: 10
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

	this.init = function(config, done) {
		console.time("Downloaded historical data");
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
		], done);
	};

	this.process = function(config, done) {

		async.waterfall([
			self.getConfig.bind(null, config),
			self.getOpenPositions,
			self.getActualPrices,
			self.saveActualPrices,
			self.appendActualPrices,
			self.processIndicators,
			self.saveIndicators,
			self.filterSellStocks,
			self.filterBuyStocks,
			self.sendOrders,
			self.saveCurrentState,
			self.saveNewEquity
		], done);
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};