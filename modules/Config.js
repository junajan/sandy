var DB = require('./Mysql');
/**
 * This will handle dynamic config
 * in application stored in MySQL DB
 */
var Config = function(app) {
	const DB_TABLE = 'config';
	var self = this;
	var _config = {};

	console.log(DB);
	this.load = function(cb) {
		// load from DB
		
	};

	this.set = function(subj, text) {
		// save to DB
	};

	this.get = function(subj, text) {
		// get from local
	};

	this.getDB = function(var, cb) {
		// _config.var = val
		// console.log()
		// cb(val);
	};

	this.getAll = function() {
		return _config;	
	};

	return this;
};

module.exports = function(app) {
	return new Config(app);
};

