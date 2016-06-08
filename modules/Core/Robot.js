var scheduler = require("./Scheduler");
var moment = require('moment');
var log = require('log4js').getLogger('Robot'); 

var Robot = function(app) {
	var self = this;
	var scheduleMorningHour = 3;
	var Openings = require("./Openings")(app);

	var DELAY_PROCESSING = 1;
	var DELAY_INIT = 10;

	self.Strategy = null;
	self.strategyInited = false;
	self.strategyConfig = {};

	this.init = function() {
		log.info("Starting robot");
	};

	this.strategyInit = function(done) {
		log.info(("Initing strategy at: "+moment().format('LT')).green);
		console.time("Initing finished");
		self.strategyInited = false;
		self.strategyConfig = {date: moment(), backtestOrders: true};

		self.Strategy.init(self.strategyConfig, function(err, res) {
			if(err) return log.error("Strategy init returned error:", err);
			
			console.timeEnd("Initing finished");
			self.strategyConfig = res;
			self.strategyInited = true;

			done && done(self.strategyConfig);
		});
	};

	this.strategyProcess = function() {
		log.info(("Running strategy at:"+ moment().format('LT')).green);
		console.time("Processing finished");
		if(!self.strategyInited) return log.error('Strategy was not properly inited, exiting');

		self.Strategy.process(self.strategyConfig, function(err, res) {
			console.timeEnd("Processing finished");
			if(err) log.error("Strategy processing returned error: ", err);
		});
	};

	this.scheduleToday = function() {
		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return log.info("Today is weekday - strategy will continue on monday");
		
		Openings.getTodaysClosingTime(moment().format('YYYY-MM-DD'), function(err, time) {
			if(err) return log.error("error when scheduling: ".red, err);

			console.log("Todays closing time is: ", time);
			if(!time) return false;

			var timeClose = moment(time, "HH:mm");
			if(!timeClose.isValid()) return console.log('Time is invalid'.red);

			var timeStrategyInit = moment(timeClose).subtract(DELAY_INIT, 'minutes');
			var timeStrategyProcess = moment(timeClose).subtract(DELAY_PROCESSING, 'minutes');
			
			log.info("Strategy will be inited today at", timeStrategyInit.format('LTS'), "and started at", timeStrategyProcess.format('LTS'));

			if(moment().isAfter(timeStrategyInit)) {

				if(moment().isBefore(moment(timeClose)))
					app.emit('event:error_late_start', {
						now: moment(),
						timeStrategyInit: timeStrategyInit,
						timeClose: moment(timeClose)
					});

				return log.error("It is too late to start strategy init today - exiting");
			}

			// schedule strategy init
			scheduler.today(timeStrategyInit.format('HH:mm'), self.strategyInit);
			scheduler.today(timeStrategyProcess.format('HH:mm'), self.strategyProcess);
		});
	};

	this.start = function(strategy) {
		self.setStrategy(strategy);

		scheduler.everyWorkweekHour(3, self.scheduleToday);

		var dayOfWeek = moment().isoWeekday();

		if(dayOfWeek == 6 || dayOfWeek == 7)
			return log.info("Today is weekday - strategy will continue on monday");
		if(moment().hour() < scheduleMorningHour)
			return log.info("Strategy will be scheduled at", scheduleMorningHour);

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