"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const async = require('async');

var Strategy = function(app) {
	const self = this;
	const config = app.config;
	const DB = app.DB;
	const Log = app.getLogger("STRATEGY");
	const MemLog = app.memLogger;

	// modules
	const Indicators = require(config.dirCore+'./Indicators');
	const Tickers = require(config.dirLoader+'./Tickers');
	const Yahoo = require(config.dirLoader+'./HistYahoo');

	if(!config.disabledOrders)
		var Broker = require(config.dirCore+"OrderManager")(app);

	// settings
	const _PRICE_COLUMN_NAME = 'close'; // or adjClose
	const _MAX_OPEN_PER_DAY = 5;
	const _INIT_FREE_PIECES = 10;
	const _HISTORY_DATA_LENGTH = 240;
	const _DB_FULL_HISTORY_TABLE = "stock_history_full";
	const _DATE_FORMAT = "YYYY-MM-DD";

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
				if(!config.feesDisabled && config.settings.feeOrderSell) {

					finalPrice -= (config.settings.feeOrderSell / pos.amount);
					orderFee = config.settings.feeOrderSell;
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
				if(!config.feesDisabled && config.settings.feeOrderBuy) {

					finalPrice += (config.settings.feeOrderBuy / pos.amount);
					orderFee = config.settings.feeOrderBuy;
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

	// this.isLastPriceEntry = function(ticker, config, done) {
	// 	if(!config.internalHistory)
	// 		return done(false);
  //
	// 	return DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and ticker = ?", [config.date.format(), ticker], function(err, res) {
	// 		if(err)
	// 			throw err;
	// 		done(!res);
	// 	});
	// };

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

	this.increaseCapital = function(config, inc, done) {

		self.getConfig(config, function(err, config) {
			config.settings.current_capital = inc + Number(config.settings.current_capital);
			config.settings.unused_capital = inc + Number(config.settings.unused_capital);
			self.saveConfig(config.settings, done);
		});
	};

	this.sendMailLog = function() {
		var buffer = MemLog.getBuffer().join("\n<br />");
		MemLog.flushBuffer();

		return app.mailer.sendDailyLog(buffer);
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

	// =====================================================
	// ================= REFACTOR ==========================
	// =====================================================

  this.countWeightenedAverage = function(oldItem, newItem) {
		return (oldItem.open_price * oldItem.amount + newItem.open_price * newItem.amount)
			/
			(oldItem.amount + newItem.amount);
  };

  this.aggregatePositions = function(list) {
    const out = {};
    list.forEach((item) => {
      const ticker = item.ticker
      if(!out[ticker])
        return out[ticker] = item;

      const prevItem = out[ticker]
      prevItem.open_price =
				self.countWeightenedAverage(prevItem, item);
      prevItem.pieces += item.pieces;
      prevItem.amount += item.amount;
		})

    return out;
  };

  this.getOpenPositions = function(config) {
    Log.info('Fetching openned positions');

    return DB.getData("*", "positions", "close_date IS null", null, "open_date ASC")
			.then((res) =>
				(config.positions = this.aggregatePositions(res))
  	  );
  };

  this.startStreamingPrices = function (config) {
  	return config.internalHistory
			? Promise.resolve()
			: Broker.startStreaming(config.tickers);
  };

  this.stopStreamingPrices = function (config) {
    return config.internalHistory
      ? Promise.resolve()
		  : Broker.stopStreaming()
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
        freePieces: _INIT_FREE_PIECES
      })
    ]);
  };

  this.deserializeHistoricalData = function(data) {
    const out = {};

    if(!data)
      return null;

    data.forEach(function(item) {
      if(!out[item.ticker])
      	out[item.ticker] = [];

      delete item.id;
      delete item.importId;
      out[item.ticker].push(item);
    });

    return out;
  };

  this.addWeekends = function(count) {
    return Math.floor(count / 5 * 7);
  }

  this.getWeekDaysInPast = function(days, from) {
    from = moment(from || moment());
    const dayNumber = from.day();
    if(dayNumber == 6) days++; // saturday
    if(dayNumber === 0) days += 2; // sunday
    return from.subtract(days || 0, 'days').format(_DATE_FORMAT);
  };

  this.serializeHistoricalData = function(data) {
    const importData = [];
    Object.keys(data).forEach((ticker) => {
      for(const item of data[ticker]) {
        importData.push([
          item.date,
          item.open,
          item.high,
          item.low,
          item.close,
          item.volume,
          item.ticker
        ]);
      }
    });

    return importData;
  };

  this.queryTickers = function(config) {
    if(config.tickers) {
      Log.warn('Using %d tickers from config instead of DB', config.tickers.length)
      return Promise.resolve(config.tickers)
    }

    return DB.getData('ticker', 'watchlist', 'active = 1')
      .then(res => (config.tickers = _.map(res, 'ticker')))
  };

  this.downloadHistory = function(config) {
    const dateFrom = this.getWeekDaysInPast(this.addWeekends(_HISTORY_DATA_LENGTH), config.date);
    const dateTo = this.getWeekDaysInPast(1, config.date);
    Log.info("Reading history data from %s to %s", dateFrom, dateTo);
    console.time("Downloaded historical data");
    let promise;

    if(config.internalHistory) {
      const tickers = "'"+config.tickers.join("','")+"'";

      promise = DB.getData("ticker, " + _PRICE_COLUMN_NAME + " as close, volume, open, high, low, date", _DB_FULL_HISTORY_TABLE, "date >= ? AND date <= ? AND ticker IN ("+tickers+") GROUP BY ticker, date, close, open, high, low, volume", [dateFrom, dateTo], "date ASC")
				.then(res => this.deserializeHistoricalData(res))
		} else {
    	throw new Error('NOT IMPLEMENTED')
      // promise = Yahoo.historical({
      //   symbols: config.tickers,
      //   from: dateFrom,
      //   to: dateTo
      // })
    }

    return promise
			.then(data => (config.history = data))
			.tap(() => console.time("Downloaded historical data"))
  };

  this.saveHistoryData = function(history, config) {
  	Log.info("Saving data for "+ Object.keys(history).length +" tickers");

    if(config.internalHistory) {
      return Promise.resolve()
    }

		Log.info('Saving historical data');
    return DB.insertMultiple(
      'stock_history (date, open, high, low, close, volume, ticker)',
      self.serializeHistoricalData(history))
  };

  this.saveNewEquity = function(date, state) {
    date = this.getDBDate(date);
    Log.info('Saving new equity with date %s', date);

    return DB.insert("equity_history", {
      capital: state.capital,
      capitalFree: state.capitalFree,
      date: date
    });
  };

  this.saveConfig = function(config) {
    return Promise.map(Object.keys(config), key =>
      DB.update("config", {val: config[key]}, "var = ?", key)
    )
  }

  this.saveState = function({state, date}) {
    Log.info('Saving config to DB');

    this.printState(state, date);
    return this.saveConfig(state);
  };

  this.printState = function(state, date) {
    Log.info(
    	"Current(%s) Equity: %s Unused: %s Free pieces: %s".yellow,
			self.getDBDate(date, false), state.capital.toFixed(2),
      state.capitalFree.toFixed(2), state.freePieces
		)
  };

  this.getDBDate = function(d, end = true) {
    return d.format(_DATE_FORMAT) + (end ? moment().format(' HH:mm:ss') : '')
  };

  this.init = function(config) {
    config.dateDb = this.getDBDate(config.date, 0)

		Log.info("Initing strategy %s", config.dateDb);
		// Log.debug("Config:", config);

		MemLog.flushBuffer();

		return this.queryTickers(config)
      .then((tickers) =>
        this.downloadHistory(config)
      )
      .then((history) =>
        this.saveHistoryData(history, config)
      )
      .then(() => this.startStreamingPrices(config))
			.return(config)
	};

  this.loadState = function(config) {
    const numberValues = 'capitalFree,capital,feeOrderBuy,feeOrderSell,freePieces'
			.split(',');

    config.state = {}
    return DB.getData("*", "config", "1=1")
			.then((res) => {
        for(const row of res) {
          config.state[row.var] = numberValues.indexOf(row.var) >= 0
						? Number(row.val)
						: row.val;
				}
        return config
			})
  };

  this.getActualPrices = function(config) {
    Log.info('Fetching actual prices');

    if(config.internalHistory) {
    	const date = moment(config.date).format(_DATE_FORMAT);
    	const tickers = "'"+config.tickers.join("','")+"'";
      return DB.getData("ticker, date, open, high, low, "+_PRICE_COLUMN_NAME+" as close, volume", _DB_FULL_HISTORY_TABLE, "date = ? AND ticker IN ("+tickers+")", date)
				.then((res) => {
    			if(!res.length)
    				return Promise.reject("noRealtimeData")
					return _.keyBy(res, 'ticker')
				})
		}

		throw new Error('NOT IMPLEMENTED')
		// Broker.getMarketPriceBulk(config.tickers, processApiResult);
  };

  this.appendActualPrices = function(config, prices) {
    Log.info('Appending actual prices');

		Object.keys(config.history).forEach((ticker) => {
			if(!prices[ticker]) {
				Log.error('Realtime price for ticker %s was not loaded - removing whole history', ticker)
				delete config.history[ticker]
				return;
			}
      config.history[ticker].push(prices[ticker])
		})
		return config.history
  };

  this.processIndicators = function(config, history) {
  	const tickers = Object.keys(history)
    Log.info('Processing indicators for %d tickers', tickers.length);
    config.indicators = {};

    tickers.forEach((ticker) => {
      const history = config.history[ticker];

      const indicators = {
        date: config.dateDb,
        ticker: ticker,
        price: parseFloat(history[history.length - 1].close),
        yesterdayDiff: parseFloat(),
        sma5: Indicators.sma(5, history),
        sma4: Indicators.sma(4, history),
        sma3: Indicators.sma(3, history),
        sma2: Indicators.sma(2, history),
        sma50: Indicators.sma(50, history),
        sma100: Indicators.sma(100, history),
        sma200: Indicators.sma(200, history),
        rsi14: Indicators.rsiWilders(14, history),
        rsi2: Indicators.rsiWilders(2, history),
        uoWinp: Indicators.uo(history, 5, 10, 15),
        uoWill: Indicators.uo(history, 7, 14, 28),
      }

      if(!indicators.sma200 || !indicators.rsi2) {
        Log.error('Error when processing indicators %s with data length %d', ticker, history.length);
        delete config.history[ticker];
        return;
      }

      config.indicators[ticker] = indicators;
    })

		return config.indicators
  };

  this.saveIndicators = function(config) {
    Log.info('Saving indicators');

    const buffer = [];
    Object.keys(config.indicators).forEach((ticker) => {
      buffer.push(_.toArray(config.indicators[ticker]));
    });

    if(!buffer.length)
      return Promise.resolve()

		if(config.internalHistory)
			return Promise.resolve()

    return DB.insertMultiple("indicators (ticker, price, sma5, sma200, rsi14, import_id)", buffer);
  };

  this.isLastPriceEntry = function(ticker, date) {
    if(!config.internalHistory)
      return false;

    return DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and ticker = ?", [config.date.format(), ticker])
			.then(res => !res)
  };

  this.filterSellStocks = function(config) {
    const oldState = config.state;
    const openedTickers = Object.keys(config.positions);
    config.newState = _.cloneDeep(oldState)
    config.closePositions = [];

    Log.info('Filtering %d open trades for sell condition', openedTickers.length);

    if(!openedTickers.length)
      return Promise.resolve()

		return Promise.map(openedTickers, (ticker) => this.isLastPriceEntry(ticker, config.dateDb))
			.then((lastEntries) => {
        const pos = config.positions[ticker];
        const indicators = config.indicators[ticker];

        console.log(indicators)
        console.log(lastEntries)
        console.log(pos)
				process.exit() // TODO remove me

        if(indicators && indicators.price > indicators.sma5 || isLast || config.sellAll) { // is openned and actual price > sma5
          if(isLast) Log.warn('Closing because %s has no more entries in DB'.yellow, ticker);
          // we will close this position
          config.closePositions[ticker] = pos;

          config.newState.capitalFree += parseFloat(indicators.price * pos.amount, 2);
          config.newState.freePieces += pos.pieces;
        }
			})
	};


  this.getStockForBuy = function(indicators, positions) {
    Log.info('Filtering stocks for buy condition');
    const stocks = [];

    if(config.sellAll)
      return indicators;

    for(const ticker of Object.keys(indicators)) {
    	const ind = indicators[ticker]
    	const pos = positions[ticker]

			if(pos) {
				console.log("PRICE MUST BE LOWER THAT 1% from previous trade")
				process.exit() // TODO remove me
			}

      if(ind.uoWinp < 30) {
				stocks.push(ind);
      }
    };

    stocks.sort(function(a, b) {
      return (a.uoWinp > b.uoWinp) ? 1 : -1;
    });

    stocks.forEach(function(ind) {
      Log.info("BuyFilter::Ticker %s Price %s %d UltOscilator %d", ind.ticker, ind.price, ind.uoWinp);
    });

    return stocks;
  };


  this.getCapitalByPiece = function(info, pieces = 1) {
    return info.capitalFree / info.freePieces * pieces;
  };

  this.getAmountByCapital = function(capital, price) {
    return parseInt(capital/price);
  };

  this.filterBuyStocks = function(config) {
    const filteredStocks = this.getStockForBuy(config.indicators, config.positions);
    const newState = config.newState;
    config.openPositions = [];

    Log.info('Selecting from %d stock to buy', filteredStocks.length);

    for(const item of filteredStocks) {
    	// Log.info("Ticker: "+ item.ticker+ " RSI: " + item.rsi.toFixed(2) + " Price: " + item.price + " Sma200: "+ item.sma200.toFixed(2) + " Sma5: "+ item.sma5.toFixed(2));

      if(!newState.freePieces) {
      	Log.warn("There are no free capital pieces for trading");
      	break;
			}

			if(config.openPositions.length >= _MAX_OPEN_PER_DAY) {
      	Log.info("Max %d open positions per day", _MAX_OPEN_PER_DAY);
      	break;
			}

			const capitalPerPiece = self.getCapitalByPiece(config.newState)
			process.exit() // TODO remove me
			const amount = self.getAmountByCapital(capitalPerPiece, item.price)

      config.openPositions.push({
        ticker: item.ticker,
        pieces: 1,
        requested_open_price: item.price,
        amount,
        price: item.price,
      });

      console.log(item)
			process.exit() // TODO remove me


      config.newState.freePieces -= parseFloat(newPos.pieces, 2);
      config.newState.capitalFree -= parseFloat(newPos.price * newPos.amount, 2);
    }
  };


  this.process = function(config) {
    Log.info("Processing strategy");

		return this.loadState(config)
			.then(() => this.getOpenPositions(config))
			.then(() => this.getActualPrices(config))
			.then(prices => this.appendActualPrices(config, prices))
			.then(history => this.processIndicators(config, history))
			.then(indicators => this.saveIndicators(config, indicators))
			.then(() => this.filterSellStocks(config))
			.then(() => this.filterBuyStocks(config))
			// .then(() => this.sendOrders(config))
			// ==== END ====
      .then(() => this.stopStreamingPrices(config))
			.then(() => this.saveNewEquity(config.date, config.state))
			.then(() => this.saveState(config))
			.catch((err) => {
				if(err === "noRealtimeData") {
					Log.warn('No realtime data for today %s .. quitting', config.dateDb)
					return Promise.resolve()
				}
				return Promise.reject(err)
			})
			.return(config)

			// .finally((res) => {
			// 	self.sendMailLog(config, res);
			// })



		// ], function(err, res) {
		// 	if(err)
		// 		Log.error("Strategy finished with an error", err);
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};