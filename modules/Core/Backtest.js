const moment = require("moment");
const Promise = require("bluebird");
const async = require("async");

const Backtest = function(Strategy, DB) {
	const self = this;
	const stats = {
		months: {},
		days: {},
		years: {}
	};

	let statsLastMonth = false;
	let statsLastYear = false;

	this.statsOnEndDay = function(info, isEnd) {
		const testDay = info.date;

		if(isEnd) {
			self.statsOnEndMonth(info, statsLastMonth);
			self.statsOnEndYear(info, statsLastYear);
			return;
		} else {

			if(statsLastMonth !== testDay.format('MM.YYYY')) {
				self.statsOnEndMonth(info, statsLastMonth);

				statsLastMonth = testDay.format('MM.YYYY');
				self.statsOnStartMonth(info, statsLastMonth);
			}

			if(statsLastYear !== testDay.format('YYYY')) {
				self.statsOnEndYear(info, statsLastYear);

				statsLastYear = testDay.format('YYYY');
				self.statsOnStartYear(info, statsLastYear);
			}
		}
	};

	this.statsOnEndMonth = function(info, month) {
		if(!month) return;
		const newCapital = info.state.capital

		stats.months[month]['dateEnd'] = info.date.format('DD.MM.YYYY');
		stats.months[month]['endCapital'] = newCapital;
		stats.months[month]['profit'] = newCapital - stats.months[month].startCapital;
		stats.months[month]['roi'] = (newCapital / stats.months[month].startCapital - 1 ) * 100

		// console.log(self.getStatItem("Month", month, stats.months[month]).yellow);
	};

	this.statsOnStartMonth = function(info, month) {
		stats.months[month] = {
			dateStart: info.date.format('DD.MM.YYYY'),
			startCapital: info.state.capital,
			openOrdersCount: 0,
			closeOrdersCount: 0,
			ordersCount: 0
		};
	};

	this.statsOnEndYear = function(info, year) {
		if(!year) return;
		const newCapital = info.state.capital;
		stats.years[year]['dateEnd'] = info.date.format('DD.MM.YYYY');
		stats.years[year]['endCapital'] = newCapital;
		stats.years[year]['profit'] = newCapital - stats.years[year].startCapital;
		stats.years[year]['roi'] = (newCapital / stats.years[year].startCapital - 1 ) * 100

		// console.log(self.getStatItem("Year", year, stats.years[year]).yellow);
	};

	this.statsOnStartYear = function(info, year) {
		stats.years[year] = {
			dateStart: info.date.format('DD.MM.YYYY'),
			startCapital: info.state.capital,
			openOrdersCount: 0,
			closeOrdersCount: 0,
			ordersCount: 0
		};
	};

	this.getStatItem = function(type, date, i) {
		return [
			type+":",
			date,
			"Start:",
			i.startCapital.toFixed(2),
			"End:",
			i.endCapital.toFixed(2),
			"Percent:",
			i.roi.toFixed(2),
			"OrderCount:",
			i.ordersCount,
			"Profit/Loss:",
			i.profit.toFixed(2)
		].join(' ');
	};

	this.printStats = function(stats) {

		console.log("===== MONTH STATS ====".yellow);
		for(var m in stats.months) {
			var i = stats.months[m];

			if(i.dateEnd)
				console.log(self.getStatItem("Month", m, i));
		}
		
		console.log("===== YEAR STATS ====".yellow);
		for(var y in stats.years) {
			var i = stats.years[y];
		
			if(i.dateEnd)
				console.log(self.getStatItem("Year", y, i));
		}
	};

	this.statsOnEndTest = function(info) {
		self.statsOnEndDay(info, true);

		console.log("=================== TEST END ===================".yellow);
		self.printStats(stats);
		console.log("=================== TEST END ===================".yellow);
	};

	this.statsOnStartTest = function(info) {
	};

	this.testConfig = function(conf) {
		return conf.from && conf.to;
	};

	this.isWeekend = function(date) {
		return date.day() == 6 || date.day() == 0;
	};

	this.wipe = function(config) {
		return Strategy.wipe(config);
	};

	this.isLastDay = function (testDate, lastDate) {
		var nextDay = testDate.clone().add(1, "day");

		if(testDate.format("YYYY-MM-DD") == lastDate)
			return true;
		else if(nextDay.format("YYYY-MM-DD") == lastDate && self.isWeekend(nextDay))
			return true;

		return false;
	};

	this.testDay = function(config, done) {
		if(self.isWeekend(config.date)) {
			// console.log("Skipping - weekend");
			return done(null);
		}

		delete config.history
		delete config.indicators
		delete config.positions

		if(self.isLastDay(config.date, config.to)) {
			console.log('Last day of backtests.. will close all remaining positions');
			config.lastDay = true;
			config.sellAll = true;
		}

		console.time("============== Date End ==============");
		Strategy.init(config)
			.then(() => {
				if(config.isTradingDay)
					console.log("============== Date: "+ config.date.format("DD.MM.YYYY") +" ==============");
			})
			.then(() => Strategy.process(config))
			.then(res => {
				console.timeEnd("============== Date End ==============");

				self.statsOnEndDay(config, config.lastDay);

				if(!config.handleSplits)
					return done(null, res);

				let promise = Promise.resolve();

				// if(this.splits[config.dateDb]) {
				// 	var tickers = Object.keys(this.splits[config.dateDb]);
				// 	promise = Promise.map(tickers, (ticker) => {
				// 		var factor = this.splits[config.dateDb][ticker]
				// 		return DB.update('positions', {
				// 				".amount": "amount * "+factor
				// 			},
				// 			'close_price IS NULL AND ticker = ?', ticker
         //    )
				// 		.then(res => {
				// 			console.log(ticker, factor)
				// 			console.log(res)
				// 			process.exit() // TODO remove me
         //    })
				// 	})
				// }

				return promise
					.then(() => done(null, res))
			})
			.catch(done);
	};

	/**
	 * Run after every test
	 * @returns {boolean} True if we should continue in testing
	 */
	this.testAfterEach = function(config, endDay) {
		// increment day
		config.date = config.date.add(1, "day");
		return !endDay.isBefore(config.date);
	};

	/**
	 * Run after test finishes
   */
	this.testAfter = function(resolve, reject, config, err, res) {
		this.statsOnEndTest(config);
		console.timeEnd("============== Finished ==============");

		return err ? reject(err) : resolve(res);
	};

	this.gatherStats = function () {
		return Promise.props({
			tradesPerYear: DB.sql('SELECT SUM(1) as count, DATE_FORMAT(close_date, "%Y") as year FROM `positions` WHERE close_date IS NOT NULL GROUP BY DATE_FORMAT(close_date, "%Y")'),
			stats: DB.sql(`SELECT 
					MAX((close_price - open_price) * amount) as max, 
					MIN((close_price - open_price) * amount) as min, 
					COUNT(id) as total
				FROM positions`),
	    avgs: DB.sql(`SELECT
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price > open_price AND close_price IS NOT NULL) as avgProfit,
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price <= open_price AND close_price IS NOT NULL) as avgLoss,
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price IS NOT NULL) as avgTrade,
				(SELECT COUNT(1) FROM positions WHERE close_price > open_price AND close_price IS NOT NULL) as winCount,
				(SELECT COUNT(1) FROM positions WHERE close_price <= open_price AND close_price IS NOT NULL) as lossCount
			`),
			yearProfits: DB.sql(`SELECT SUM((close_price - open_price) * amount) as profit, DATE_FORMAT(close_date, '%Y') as year FROM positions WHERE close_date IS NOT NULL GROUP BY DATE_FORMAT(close_date, '%Y')`),
			maxDD: DB.sql(`SELECT *, (lowerLaterCapital - capital) / capital * -100 as dd FROM (SELECT date, capital, (SELECT MIN(capital) FROM equity_history el WHERE el.date > eh.date) as lowerLaterCapital FROM equity_history as eh) as tmp WHERE lowerLaterCapital IS NOT NULL AND lowerLaterCapital < capital ORDER BY dd DESC LIMIT 10`)
  })
		.then(({ stats, tradesPerYear, avgs, maxDD }) => {
			console.log("=== Trades per year ===")
      tradesPerYear.forEach((y) => {
				console.log("%d: %d", y.year, y.count)
			})
			console.log("=======================")

      stats = stats[0]
      avgs= avgs[0]
			console.log("Total trades: %s", stats.total)
      console.log("Win count: %s", avgs.winCount)
      console.log("Loss count %s", avgs.lossCount)
      console.log("Avg win: %s%", parseFloat(avgs.winCount / stats.total * 100, 2))
			console.log("Max profit: %s USD", stats.max)
			console.log("Max loss: %s USD", stats.min)
			console.log("Avg profit: %s USD", avgs.avgProfit || 0)
			console.log("Avg loss: %s USD", avgs.avgLoss || 0)
			console.log("Avg trade: %s USD", avgs.avgTrade || 0)
			console.log("==== 5 MAX DD ====")
			if(maxDD.length)
				maxDD.forEach((dd) => {
					console.log("%s: loss %d = %d%",
						dd.date, dd.capital - dd.lowerLaterCapital, dd.dd)
				})
			else
				console.log(" .. no DD")


		})
  };

  this.loadSplits = function(config) {
    var cond = 'splitRatio <> 1 AND ticker IN ("'+config.tickers.join('","')+'")';
    this.splits = {}

    return DB.getData("DATE_FORMAT(date, '%Y-%m-%d') as date, ticker, splitRatio", "stock_history_full_quandl", cond)
			.then(res => {
				res.forEach(item => {
					if(!this.splits[item.date])
            this.splits[item.date] = {}

					this.splits[item.date][item.ticker] = item.splitRatio
				})
      })
	}

	/**
	 * Core method which runs test day by day
	 * @param config {from, to, capital, tickers} Object
	 * @returns {Promise}
   */
	this.run = function(config) {
		if(!self.testConfig(config))
			return Promise.reject(new Error("Config must contain from and to attributes"));

		console.log("Starting backtest from", config.from, "to", config.to);
		console.time("============== Finished ==============");

		const endDay = moment(config.to);
		config.date = moment(config.from);
		config.backtest = true;

		self.statsOnStartTest(config);

		return this.loadSplits(config)
			.then(() => new Promise((resolve, reject) => {
				async.doWhilst(
					done => this.testDay(config, done),
					() => this.testAfterEach(config, endDay),
					(err, res) => this.testAfter(resolve, reject, config, err, res)
				);
			}))
			.tap(() => this.gatherStats(config));
	};

	return this;
};


module.exports = function(conf, db) {
	return new Backtest(conf, db);
};

