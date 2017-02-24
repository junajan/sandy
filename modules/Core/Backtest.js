var moment = require("moment");
var async = require("async");

var Backtest = function(Strategy, DB) {
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

		var openCount = info.openPositions.length;
		var closeCount = Object.keys(info.closePositions).length;

		stats.months[statsLastMonth]['openOrdersCount'] += openCount;
		stats.months[statsLastMonth]['closeOrdersCount'] += closeCount;
		stats.months[statsLastMonth]['ordersCount'] += openCount + closeCount;

		stats.years[statsLastYear]['openOrdersCount'] += openCount;
		stats.years[statsLastYear]['closeOrdersCount'] += closeCount;
		stats.years[statsLastYear]['ordersCount'] += openCount + closeCount;
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

	this.isLastDay = function (testDate, lastDate) {
		var nextDay = testDate.clone().add(1, "day");

		if(testDate.format("YYYY-MM-DD") == lastDate)
			return true;
		else if(nextDay.format("YYYY-MM-DD") == lastDate && self.isWeekend(nextDay))
			return true;

		return false;
	};


  this.gatherStats = function () {
    return async.parallel({
      tradesPerYear: function(done) {
        DB.sql('SELECT SUM(1) as count, DATE_FORMAT(close_date, "%Y") as year FROM `positions` WHERE close_date IS NOT NULL GROUP BY DATE_FORMAT(close_date, "%Y")', null, done)
      },
      stats: function(done) {
        DB.sql(`SELECT 
					MAX((close_price - open_price) * amount) as max, 
					MIN((close_price - open_price) * amount) as min, 
					COUNT(id) as total
				FROM positions`, null, done)
      },
      avgs: function(done) {
        DB.sql(`SELECT
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price > open_price AND close_price IS NOT NULL) as avgProfit,
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price <= open_price AND close_price IS NOT NULL) as avgLoss,
				(SELECT AVG((close_price - open_price) * amount) FROM positions WHERE close_price IS NOT NULL) as avgTrade,
				(SELECT COUNT(1) FROM positions WHERE close_price > open_price AND close_price IS NOT NULL) as winCount,
				(SELECT COUNT(1) FROM positions WHERE close_price <= open_price AND close_price IS NOT NULL) as lossCount
			`, null, done)
      },
      yearProfits: function(done) {
        DB.sql(`SELECT SUM((close_price - open_price) * amount) as profit, DATE_FORMAT(close_date, '%Y') as year FROM positions WHERE close_date IS NOT NULL GROUP BY DATE_FORMAT(close_date, '%Y')`
          , null
          , done)
      },
      maxDD: function(done) {
        DB.sql(`SELECT *, (lowerLaterCapital - capital) / capital * -100 as dd FROM (SELECT date, capital, (SELECT MIN(capital) FROM equity_history el WHERE el.date > eh.date) as lowerLaterCapital FROM equity_history as eh) as tmp WHERE lowerLaterCapital IS NOT NULL AND lowerLaterCapital < capital ORDER BY dd DESC LIMIT 10`, null, done)
      }
    }, function(err, all) {
      if(err) throw err;

      var stats = all.stats
      var tradesPerYear = all.tradesPerYear
      var avgs = all.avgs
      var maxDD = all.maxDD

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

  this.run = function(config, dayCallback, finishCallback) {
		if(!self.testConfig(config))
			return console.log("Config must contain from and to attributes");
		console.log("Starting backtest from", config.from, "to", config.to);

		var testDay = moment(config.from);
		var endDay = moment(config.to);
		config.dontPersist = true;
		config.internalHistory = true;

		console.time("============== Finished ==============");
		
		self.statsOnStartTest(config);

		async.doWhilst(function(done) {
			console.log("============== Date: "+ testDay.format("DD.MM.YYYY") +" ==============");
			console.time("============== Date End ==============");
			if(self.isWeekend(testDay)) {
				console.log("Skipping - weekend");
				return done(null);
			}

			config.date = testDay;

			if(self.isLastDay(testDay, config.to)) {
				console.log('Last day of backtests.. will close all remaining positions');
				config.lastDay = true;
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
						if(config.processingDelay)
							console.log("Delaying processing - "+config.processingDelay+"ms");

						setTimeout(function () {

							Strategy.process(config, function(err, res) {

								self.statsOnEndDay(config, config.lastDay);

								dayCallback && dayCallback();
								console.timeEnd("============== Date End ==============");
								done(err);
							});
						}, config.processingDelay || 0);
					}], done);

			});
			
		}, function() {
			// increment day
			testDay = testDay.add(1, "day");
			return !endDay.isBefore(testDay);
		}, function(err) {

			self.statsOnEndTest(config);
      self.gatherStats()

			console.timeEnd("============== Finished ==============");
			if(err) console.log(err);
			finishCallback && finishCallback();
		});
	};

	return this;
};


module.exports = function(S, DB) {
	return new Backtest(S, DB);
};

