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
	const Broker = require(config.dirCore+"OrderManager")(app);

	// settings
	const _PRICE_COLUMN_NAME = 'adjClose'; // or adjClose
	// const _PRICE_COLUMN_NAME = 'close'; // or adjClose
	const _MAX_OPEN_PER_DAY = 5;
	const _INIT_FREE_PIECES = 10;
	const _HISTORY_DATA_LENGTH = 30;
	// const _DB_FULL_HISTORY_TABLE = "stock_history_full";
	const _DB_FULL_HISTORY_TABLE = "stock_history_full_quandl";
	const _DATE_FORMAT = "YYYY-MM-DD";

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
      const ticker = item.ticker;

      if(!out[ticker]) {
        out[ticker] = item;
        out[ticker].list = [{
          amount: item.amount,
          open_date: item.open_date,
          open_price: item.open_price
        }];
        return;
      }

      out[ticker].list.push({
        amount: item.amount,
        open_date: item.open_date,
        open_price: item.open_price
      });

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

    return DB.getData("*", "positions", "close_date IS null", null, "open_date DESC")
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

      promise = DB.getData("ticker, " + _PRICE_COLUMN_NAME + " as close, volume, adjOpen as open, adjHigh as high, adjLow as low, date", _DB_FULL_HISTORY_TABLE, "date >= ? AND date <= ? AND ticker IN ("+tickers+")", [dateFrom, dateTo], "date ASC")
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
      return DB.getData("ticker, date, adjOpen as open, adjHigh as high, adjLow as low, "+_PRICE_COLUMN_NAME+" as close, volume", _DB_FULL_HISTORY_TABLE, "date = ? AND ticker IN ("+tickers+")", date)
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
      const price = parseFloat(history[history.length - 1].close);

      if(history.length <= 15) {
        delete config.history[ticker]
        return;
      }

      const prevPrice = parseFloat(history[history.length - 2].close);
      const indicators = {
        date: config.dateDb,
        ticker: ticker,
        price, prevPrice,
        priceDiff: Indicators.percentDiff(prevPrice, price) * -1,
        // sma: Indicators.sma(5, history, ticker),
        // sma4: Indicators.sma(4, history, ticker),
        // sma3: Indicators.sma(3, history, ticker),
        // sma2: Indicators.sma(2, history, ticker),
        // sma50: Indicators.sma(50, history, ticker),
        // sma100: Indicators.sma(100, history, ticker),
        // sma200: Indicators.sma(200, history, ticker),
        rsi14: Indicators.rsiWilders(14, history),
        rsi: Indicators.rsiWilders(2, history),
        uo: Indicators.uo(history, 5, 10, 15),
        // uo: Indicators.uo(history, 7, 14, 28),
      }

      // console.log(indicators)
      // process.exit() // TODO remove me

      if(indicators.uo < 0) {
        Log.error('Error when processing indicators %s with data length %d and uo', ticker, history.length, indicators.uo);
        delete config.history[ticker];
        process.exit() // TODO remove me
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
      return Promise.resolve(false);

    return DB.get("id", _DB_FULL_HISTORY_TABLE, "date > ? and ticker = ?", [config.date.format(), ticker])
			.then(res => !res)
  };

  this.sendOrders = function(config) {
    const close = config.closePositions;
    const open = config.openPositions;
    Log.info('Sending %d close and %d open orders', close.length, open.length);

    this.printState(config.state, config.date);

		return this.closePositions(config, close)
			.then(() => this.openPositions(config, open))
  };

  this.filterSellStocks = function(config) {
    const oldState = config.state;
    const openedTickers = Object.keys(config.positions);
    config.newState = _.cloneDeep(oldState)
    config.closePositions = [];

    Log.info('Filtering %d open trades for sell condition', openedTickers.length);

    if(!openedTickers.length)
      return Promise.resolve();

		return Promise.map(openedTickers, (ticker) => {
      return this.isLastPriceEntry(ticker, config.dateDb)
				.then((isLastEntry) => {
          const pos = config.positions[ticker];
          const ind = config.indicators[ticker];

          if(!ind) {
          	Log.error('Error when filtering ticker %s for sell condition', ticker)
						return
					}

          const pricePercentDiff = Indicators.percentDiff(pos.open_price, ind.price);
					if(config.sellAll || isLastEntry ||
            (
					    pricePercentDiff > 1
              // || pricePercentDiff < -8
              || ind.uo > 35
            )
          ) {
            config.closePositions.push(pos)

            config.newState.capitalFree += parseFloat(ind.price * pos.amount, 2);
            config.newState.freePieces += pos.pieces;
          }
				});
		});
	};

  this.closePositions = function(config, close) {
    return Promise.map(close, (pos) => {

    	return new Promise((resolve, reject) => {
        const ind = config.indicators[pos.ticker];

				Broker.sendSellOrder(pos.ticker, pos.amount, "MKT", ind.price, (err, res) => {
					if(err && err.codeName === 'timeout') {
						Log.error("Timeout during sell order", err.errorText || err.toString());

						// this will disable new open/scale orders
						config.disableOrders = true;
						return resolve(null, err);

					} else if(err) {
						Log.error("Error during sell order", err.errorText || err.toString());
						return reject(err.toString());
					}

					const profit = ((res.price - pos.open_price) * pos.amount).toFixed(2);
          Log.info("%s %dx %s for %d USD | Profit: %d USD",
						"CLOSE:".red, pos.amount, pos.ticker, res.price, profit)

					const request = {
            close_price: res.price,
            close_date: self.getDBDate(config.date)
          };

					return DB.update("positions",request, "close_price IS NULL AND ticker = ?", pos.ticker)
						.then(() => {
              // decrement available resources
              config.state.capital += parseFloat(res.price * res.amount - pos.open_price * pos.amount, 2);
              config.state.capitalFree += parseFloat(res.price * res.amount, 2);
              config.state.freePieces += pos.pieces;
              resolve()
						});
        });
      });
    });
  };

  this.openPositions = function(config, open) {
    if(config.lastDay)
      return Promise.resolve();

    if(config.disableOrders) {
      Log.error('There was a problem when closing orders - open/scale orders are disabled'.red);
      return Promise.resolve();
    }

		return Promise.map(open, (pos) => {
      const type = config.positions[pos.ticker]
				? "SCALE"
				: "OPEN";

      return new Promise((resolve, reject) => {
      	Broker.sendBuyOrder(pos.ticker, pos.amount, "MKT", pos.price, (err, res) => {
					if(err && err.codeName == 'timeout') {
						Log.error("Timeout during buy order", (err.errorText || err.toString()));
						return resolve(null, err);
					} else if(err) {
						Log.error("Error during buy order", (err.errorText || err.toString()));
						return reject(err.toString());
					}

					Log.info('%s %dx %s for %s USD', (type+': ').green, pos.amount, pos.ticker, res.price);

					delete pos.price;
          pos = _.extend(pos, {
						open_price: res.price,
            open_date: self.getDBDate(config.date)
          })

          return DB.insert("positions", pos)
						.catch(reject)
						.then(() => {
							config.state.capitalFree -= res.price * res.amount;
							config.state.freePieces -= pos.pieces;
              resolve(res)
						})
	      });
      })
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

      if(ind.priceDiff > 8)
        continue;

      if(ind.uo < 30) {
        if(pos) {
          const lastPos = pos.list[0];

          if(pos.list.length > 1)
            continue;

          const priceDiff = Indicators.percentDiff(lastPos.open_price, ind.price);
          if(priceDiff < -1) {
            Log.info("Scaling up a position because of a price is more than 1% lower");
            stocks.push(ind);
          }
	  		} else  {
				  stocks.push(ind);
        }
      }
    }

    stocks.sort(function(a, b) {
      return (a.uo > b.uo) ? 1 : -1;
    });

    // stocks.forEach(function(ind) {
    //   Log.info("BuyFilter::Ticker %s Price %s UltOscilator %d", ind.ticker, ind.price, ind.uo);
    // });

    return stocks;
  };

  this.getCapitalByPiece = function(info, pieces = 1) {
    return info.capitalFree / info.freePieces * pieces;
  };

  this.getAmountByCapital = function(capital, price) {
    return parseInt(capital / price);
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

			// if(config.openPositions.length >= _MAX_OPEN_PER_DAY) {
			if(config.openPositions.length >= 5) {
      	Log.info("Max %d open positions per day", _MAX_OPEN_PER_DAY);
      	break;
			}

			const capitalPerPiece = self.getCapitalByPiece(config.newState)
			const amount = self.getAmountByCapital(capitalPerPiece, item.price)

      // not enought capital to buy this stock
      if(amount < 1)
        continue;

			const newPos = {
        amount,
        pieces: 1,
        ticker: item.ticker,
        price: item.price,
      }

      newState.freePieces--;
      newState.capitalFree -= parseFloat(newPos.price * newPos.amount, 2);
      config.openPositions.push(newPos);
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
			.then(() => this.sendOrders(config))
			// ==== END ====
      .then(() => this.stopStreamingPrices(config))
			.then(() => this.saveNewEquity(config.date, config.state))
			.then(() => this.saveState(config))
			.return(config)
			.catch((err) => {
				if(err === "noRealtimeData") {
					Log.warn('No realtime data for today %s .. quitting', config.dateDb)
					return Promise.resolve()
				}

				// self.sendMailLog(config);
				Log.error("Strategy finished with an error:", err.toString());
				return Promise.reject(err)
			});
	};

	return this;
};


module.exports = function(app) {
	return new Strategy(app);
};