var schedule = require('node-schedule');
var moment = require('moment');

var Scheduler = function() {
	var self = this;

	self.everyWorkweekHour = function(hour, cb) {
		
		var rule = new schedule.RecurrenceRule();
		rule.dayOfWeek = [new schedule.Range(1, 5)];
		rule.hour = hour;
		rule.minute = 0;
		 
		var j = schedule.scheduleJob(rule, cb);
	};

	self.everyDayHour = function(hour, cb) {
		
		var rule = new schedule.RecurrenceRule();
		rule.hour = hour;
		rule.minute = 0;
		 
		var j = schedule.scheduleJob(rule, cb);
	};

	self.cron = function(schedule, cb) {
		return schedule.scheduleJob(schedule, cb);
	};

	self.today = function(time, cb) {
		time = time.split(":");
		
		var date = (new Date());
		date.setMinutes(time[1]);
		date.setHours(time[0]);
		date.setSeconds(0); 
		
		return schedule.scheduleJob(date, cb);
	}
	return this;
};

module.exports = new Scheduler();