var moment = require("moment");
var async = require("async");

var Backtest = function(Strategy) {
	var self = this;
	var stats = {
		months: {},
		days: {},
		years: {},
	};

	var statsLastMonth = false;
	var statsLastYear = false;

	this.getNextWorkDay = function(date) {

		var date = moment(date).add(1, "day");
		if(date.day() == 6)
			return date.add(2, 'day');
		if(date.day() == 0)
			return date.add(1, 'day');
		
		return date;
	};

	this.statsOnEndDay = function(info, isEnd) {
		var testDay = info.date;

		if(isEnd) {
			self.statsOnEndMonth(info, statsLastMonth);
			self.statsOnEndYear(info, statsLastYear);

			return;
		}

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

		var openCount = info.openPositions.length;
		var closeCount = Object.keys(info.closePositions).length;

		stats.months[statsLastMonth]['openOrdersCount'] += openCount;
		stats.months[statsLastMonth]['closeOrdersCount'] += closeCount;
		stats.months[statsLastMonth]['ordersCount'] += openCount + closeCount;

		stats.years[statsLastYear]['openOrdersCount'] += openCount;
		stats.years[statsLastYear]['closeOrdersCount'] += closeCount;
		stats.years[statsLastYear]['ordersCount'] += openCount + closeCount;


		// var tommorow = self.getNextWorkDay(testDay);

		// if(isEnd || tommorow.format('MM') !== statsLastMonth)
		// 	self.statsOnEndMonth(info);
		
		// if(isEnd || tommorow.format('YYYY') !== statsLastYear)
		// 	self.statsOnEndYear(info);
	};


	this.statsOnEndMonth = function(info, month) {
		if(!month) return;

		stats.months[month]['dateEnd'] = info.date.format('DD.MM.YYYY');
		stats.months[month]['endCapital'] = info.newState.current_capital;
		stats.months[month]['profit'] = info.newState.current_capital - stats.months[month].startCapital;
		stats.months[month]['roi'] = (info.newState.current_capital / stats.months[month].startCapital - 1 ) * 100

		console.log(self.getStatItem("Month", month, stats.months[month]).yellow);
	};

	this.statsOnStartMonth = function(info, month) {

		stats.months[month] = {
			dateStart: info.date.format('DD.MM.YYYY'),
			startCapital: info.newState.current_capital,
			openOrdersCount: 0,
			closeOrdersCount: 0,
			ordersCount: 0
		};
	};

	this.statsOnEndYear = function(info, year) {
		if(!year) return;
		
		stats.years[year]['dateEnd'] = info.date.format('DD.MM.YYYY');
		stats.years[year]['endCapital'] = info.newState.current_capital;
		stats.years[year]['profit'] = info.newState.current_capital - stats.years[year].startCapital;
		stats.years[year]['roi'] = (info.newState.current_capital / stats.years[year].startCapital - 1 ) * 100

		self.printStats(stats);
		// console.log(self.getStatItem("Year", year, stats.years[year]).yellow);
	};

	this.statsOnStartYear = function(info, year) {

		stats.years[year] = {
			dateStart: info.date.format('DD.MM.YYYY'),
			startCapital: info.newState.current_capital,
			openOrdersCount: 0,
			closeOrdersCount: 0,
			ordersCount: 0
		};
	};

	self.getStatItem = function(type, date, i) {
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

	self.printStats = function(stats) {

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
	this.wipe = Strategy.initClear;

	this.run = function(config, dayCallback, finishCallback) {
		if(!self.testConfig(config))
			return console.log("Config must contain from and to attributes");
		console.log("Starting backtest from", config.from, "to", config.to);

		var testDay = moment(config.from);
		var endDay = moment(config.to);
		config.dontPersist = true;
		config.backtest = true;
		config.backtestOrders = true;
		config.internalHistory = true;
		console.time("============== Finished ==============");
		
		self.statsOnStartTest(config);

		async.doWhilst(function(done) {
			console.log("============== Date: "+ testDay.format("DD.MM.YYYY") +" ==============");
			console.time("============== Date End ==============");
			if(self.isWeekend(testDay)) {
				console.log("Skipping - weekend");
				return done(null);
			};

			config.date = testDay;

			if(testDay.format("YYYY-MM-DD") == config.to) {
				console.log('Last day of backtests.. will close all remaining positions')
				config.sellAll = true;
			}

			Strategy.init(config, function(err, res) {
				if(err) console.log(err);

				async.series([
					function(done) {
						if(config.monthlyAdd && Number(testDay.format("DD")) == 1)
							Strategy.increaseCapital(config, config.monthlyAdd, done);
						else
							done(null, 1);
					},
					function(done) {
						
						Strategy.process(config, function(err, res) {

							self.statsOnEndDay(config);

							dayCallback && dayCallback();
							console.timeEnd("============== Date End ==============");
							done(err);
						});
					}], done);

			});
			
		}, function() {
			// increment day
			testDay = testDay.add(1, "day");
			return !endDay.isBefore(testDay);
		}, function(err) {

			self.statsOnEndTest(config);

			console.timeEnd("============== Finished ==============");
			if(err) console.log(err);
			finishCallback && finishCallback();
		});
	};

	return this;
};


module.exports = function(S) {
	return new Backtest(S);
};

