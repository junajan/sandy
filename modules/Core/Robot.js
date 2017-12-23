var splitCheck = require("./SplitCheck");
var scheduler = require("./Scheduler");
var moment = require('moment');
var _ = require('lodash');

var Robot = function(app) {
	var self = this;
	var scheduleMorningHour = 3;
	var Openings = require("./Openings")(app);
	var Log = app.getLogger("ROBOT");
	const DELAY_PROCESSING = 1;
	const DELAY_INIT = 10;

	self.SplitCheck = new splitCheck(app);
	self.Strategy = null;
	self.strategyInited = false;
	self.strategyConfig = {};

	this.init = function() {
		Log.info("Starting robot");
	};

	this.strategyInit = function(done) {
		Log.info(("Initing strategy at: "+moment().format('LT')).green);
		console.time("Initing finished");
		self.strategyInited = false;
		self.strategyConfig = {date: moment()};

		self.Strategy.init(self.strategyConfig, function(err, res) {
			if(err) return Log.error("Strategy init returned error:", err);
			
			console.timeEnd("Initing finished");
			self.strategyConfig = res;
			self.strategyInited = true;

			done && done(self.strategyConfig);
		});
	};

	this.strategyProcess = function(done) {
		Log.info(("Running strategy at:"+ moment().format('LT')).green);
		console.time("Processing finished");
		if(!self.strategyInited) return Log.error('Strategy was not properly inited, exiting');

		self.Strategy.process(self.strategyConfig, function(err, res) {
			console.timeEnd("Processing finished");
			if(err) Log.error("Strategy processing returned an error:", err);

			if(_.isFunction(done)) done(err, res);
		});
	};

	this.splitCheck = function (done) {
    Log.info(("Running split check at:"+ moment().format('LT')).green);
    console.time("SplitCheck finished");

    self.SplitCheck.splitCheck(self.strategyConfig, function(err, stocks) {
      console.timeEnd("SplitCheck finished");
      if(err) Log.error("SplitCheck returned an error:", err);

      if(err) return Log.error("Error when checking splits: ".red, err);
      if(stocks.length)
        app.emit('event:warn_split_checker', stocks);

      if(_.isFunction(done)) done(err, stocks);
    });
  }

	this.scheduleToday = function() {
		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return Log.info("Today is weekday - strategy will continue on monday");
		
		Openings.getTodaysClosingTime(moment().format('YYYY-MM-DD'), function(err, time) {
			if(err) return Log.error("error when scheduling: ".red, err);
			// do not trade if there is a holiday
			if(!time) return false;

			console.log("Today's closing time is at:", time);

			var timeClose = moment(time, "HH:mm");
			if(!timeClose.isValid()) return console.log('Time is invalid'.red);

			const times = {
				init: moment(timeClose).subtract(DELAY_INIT, 'minutes'),
				process: moment(timeClose).subtract(DELAY_PROCESSING, 'minutes'),
				splitCheck: moment('10:00', 'HH:mm')
			}

			Log.info("Strategy will be inited today at", times.init.format('LTS'), "and started at", times.process.format('LTS'));

			if(moment().isAfter(times.init)) {

				if(moment().isBefore(moment(timeClose)))
					app.emit('event:error_late_start', {
						now: moment(),
						timeStrategyInit: times.init,
						timeClose: moment(timeClose)
					});

				return Log.error("It is too late to start strategy init today - exiting");
			}

			// schedule processes
			scheduler.today(times.init.format('HH:mm'), self.strategyInit);
			scheduler.today(times.process.format('HH:mm'), self.strategyProcess);
			// scheduler.today(times.splitCheck.format('HH:mm'), self.splitCheck); // TODO DISABLED
		});
	};

	this.start = function(strategy) {
		self.setStrategy(strategy);

		scheduler.everyWorkweekHour(3, self.scheduleToday);

		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return Log.info("Today is a weekend - strategy will continue on Monday");
		if(moment().hour() < scheduleMorningHour)
			return Log.info("Strategy will be scheduled at %dAM", scheduleMorningHour);

		self.scheduleToday();
	};

	this.setStrategy = function(strategy) {
		self.Strategy = strategy;
	};

	this.init();
	return this;
};

module.exports = function(app) {
	return new Robot(app);
};