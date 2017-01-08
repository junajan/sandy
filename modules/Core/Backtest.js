var moment = require("moment");
var async = require("async");

var Backtest = function(Strategy) {
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
				if(config.isTradingDay)
					console.timeEnd("============== Date End ==============");

				self.statsOnEndDay(config, config.lastDay);
				done(null, res)
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

		return new Promise((resolve, reject) => {
			async.doWhilst(
				done => this.testDay(config, done),
				() => this.testAfterEach(config, endDay),
				(err, res) => this.testAfter(resolve, reject, config, err, res)
			);
		});
	};

	return this;
};


module.exports = function(conf) {
	return new Backtest(conf);
};

