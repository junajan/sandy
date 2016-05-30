var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');

var Openings = function(app) {
	const DB_TABLE = 'exchange_schedule';

	var self = this;
	var DB = app.DB;
	var config = app.config;
	var defaultOpenings = false;

	var nasdaqHoursUrl = "https://business.nasdaq.com/discover/events/trading-hours/index.html";
	var nyseHoursUrl = "https://www.nyse.com/markets/hours-calendars";

	this.getDefaultHours = function(done) {
		DB.getData('*', 'config', "var = 'exchange_closing' OR var = 'exchange_opening'", function(err, res) {
			if(err) return done(err, null);
			
			defaultOpenings = res ? {} : false;
			res.forEach(function(item) {
				defaultOpenings[item['var']] = item.val;
			});
			done(null, defaultOpenings);
		});
		return null;
	};

	this.checkSchedule = function(date, done) {
		DB.get('close, date, note', DB_TABLE, 'invalidated IS NULL AND date = ?', date, done);
	};

	this.getTodaysClosingTime = function(date, done) {
		async.parallel({regular: self.getDefaultHours, exception: self.checkSchedule.bind(null, date)}, function(err, res) {
			if(err) return done(err);

			if(moment(date).format('d') % 6 == 0) { // is weekend
				console.log("Date", date, "is weekend");
				return done(null, null);
			}

			if(res.exception) {
				console.log("Schedule exception for today: ", res.exception.note);
				return done(null, res.exception.close);
			}

			done(null, res.regular.exchange_closing);
		});
	};
	
	this.invalidateData = function(done) {
		console.log("Invalidating current year");
		DB.update('exchange_schedule', {'.invalidated': 'NOW()'}, 'YEAR(date) = ?', moment().year(), done);
	};

	this.downloadNasdaqOpenings = function(done) {
		var $, openings = [];

		console.log("Downloading", nasdaqHoursUrl);

		request(nasdaqHoursUrl, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    $ = cheerio.load(body);
		    $ = cheerio.load($("table.table_design").first().html());
		    $('tr').each(function(index, val){
		    	if(index) {
		    		var indexes = ['date', 'note', 'close'];
		    		var day = {};
		    		var c = cheerio.load(val)("td");
		    		c.each(function(index, val) {
		    			val = cheerio.load(val).html().replace(/(<[^>]*>|\n)/gi, '');
		    			day[indexes[index]] = val;
		    		});
		    		openings.push(day);
		    	}
		    });

		    openings.forEach(function(val, index) {
		    	val.date = moment(val.date, 'DD MMM', 'en').format('YYYY-MM-DD');
		    	
		    	var t = moment(val.close, 'h a');
		    	val.close = t.isValid() ? t.format('HH:mm') : null;
		    	val.stock = 'NASDAQ';
		    });

		    return done(null, openings);
		  }

		  done(error);
		});
	};
	
	this.importNasdaq = function(done) {
		self.downloadNasdaqOpenings(function(err, openings) {
			if(err) return done(err);

			var data = [];
			openings.forEach(function(val) {
				data.push([val.date, val.close, val.stock, val.note]);
			});

			DB.insertValues(DB_TABLE+' (date, close, stock, note)', data, done);
		});
	};

	this.importData = function(done) {

		self.invalidateData(function(err, res) {
			if(err) return done(err, res);

			async.parallel([
				self.importNasdaq,
				// self.importNyse
			], done);
		});
	};

	return this;
};

module.exports = function(app) {
	return new Openings(app);
};