var moment = require("moment");

var Log = function(app, conf) {
	var self = this;
	
	this.time = function() {
		return moment().format("[DD.MM.YYYY HH:MM:SS] ");
	};
	
	this.log = function(text, data){
		console.log(self.time+text);
	};
	
	this.event = function(code, text, data) {
		self.log(code + ": "+text, data);
	};
	
	this.warn = function(code, text, data) {
		self.log((code + ": "+text).yellow, data);
	};
	
	this.error = function(code, text, data) {
		self.log((code + ": "+text).red, data);
	};
	
	return this;
};

module.exports = function(app, s) {
	return new Log(app, s)
};