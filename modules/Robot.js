var scheduler = require("./Scheduler");
var moment = require('moment');

var Robot = function(app) {
	var self = this;
	var scheduleMorningHour = 3;
	var Openings = require("./Openings")(app);
	
	var Strategy = null;
	var strategyInited = false;
	var strategyConfig = {};

	this.init = function() {
		console.log("Starting robot");
	};

	this.strategyInit = function() {
		console.log("Initing strategy at: ", moment().format('LT'));
		console.time("Initing finished");
		self.strategyInited = false;
		self.strategyConfig = {date: moment(), backtest: true};

		Strategy.init(config, function(err, res) {
			if(err) return console.log("Strategy init returned error:", err);
			
			console.timeEnd("Initing finished");
			self.strategyInited = false;
		});
	};

	this.strategyProcess = function() {
		console.log("Running strategy at:", moment().format('LT'));
		console.time("Processing finished");
		if(!self.strategyInited) return console.log('Strategy was not properly inited, exiting');

		Strategy.process(self.strategyConfig, function(err, res) {
			console.timeEnd("Processing finished");
		});
	};

	this.scheduleToday = function() {
		Openings.getTodaysClosingTime('2015-12-21', function(err, time) {
			if(err) return console.log("ERROR when scheduling: ".red, err);

			console.log("Todays closing time is: ", time);
			if(!time) return false;

			var timeClose = moment(time, "HH:mm");
			if(!timeClose.isValid()) return console.log('Time is invalid'.red);

			var timeStrategyInit = moment(timeClose).subtract(30, 'minutes');
			var timeStrategyProcess = moment(timeClose).subtract(1, 'minutes');
			
			console.log("Strategy will be inited today at", timeStrategyInit.format('LTS'), "and started at", timeStrategyProcess.format('LTS'));

			if(moment().isAfter(timeStrategyInit)) {
				return console.log("It is too late to start strategy init today - exiting");
			}

			// schedule strategy init
			scheduler.today(timeStrategyInit.format('HH:mm'));
			scheduler.today(timeStrategyProcess.format('HH:mm'));
		});
	};

	this.start = function(strategy) {
		self.Strategy = strategy;

		scheduler.everyWorkweekHour(3, self.scheduleToday);

		if(moment().hour() >= scheduleMorningHour)
			self.scheduleToday();
	}

	this.init();
	return this;
};

module.exports = function(app) {
	return new Robot(app);
};