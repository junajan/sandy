var schedule = require('node-schedule');
var moment = require('moment');


var Scheduler = function() {
	var self = this;

	self.everyWorkweekHour = function(hour, cb) {
		
		var rule = new schedule.RecurrenceRule();
		rule.dayOfWeek = [0, new schedule.Range(1, 5)];
		rule.hour = hour;
		rule.minute = 0;
		 
		var j = schedule.scheduleJob(rule, cb);
	};

	self.cron = function(schedule, cb) {
		return schedule.scheduleJob(schedule, cb);
	};

	self.today = function(h, m, cb) {
		var date = (new Date());
		date.setMinutes(m);
		date.setHours(h);
		date.setSeconds(0); 
		
		console.log(moment().format(), " => ", moment(date).format());
		return schedule.scheduleJob(date, cb);
	}
	return this;
};

module.exports = new Scheduler();