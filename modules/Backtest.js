var moment = require("moment");
var async = require("async");

var Backtest = function(Strategy) {
	var self = this;

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
		config.internalHistory = true;
		console.time("============== Finished ==============");

		async.doWhilst(function(done) {
			console.log("============== Date: "+ testDay.format("DD.MM.YYYY") +" ==============");
			console.time("============== Date End ==============");
			if(self.isWeekend(testDay)) {
				console.log("Skipping - weekend");
				return done(null);
			};

			config.date = testDay;

			Strategy.init(config, function(err, res) {
				if(err) console.log(err);
				
				Strategy.process(config, function(err, res) {
					dayCallback && dayCallback();
					console.timeEnd("============== Date End ==============");
					done(err);
				});
			});
			
		}, function() {
			// increment day
			testDay = testDay.add(1, "day");
			return !endDay.isBefore(testDay);
		}, function(err) {
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

