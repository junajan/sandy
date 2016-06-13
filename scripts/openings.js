'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);

var app = {
	config: config,
	DB: DB
}

config.disabledOrders = true;
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = function (type) {
	return app.logger.getLogger(type);
};

var Openings = require(config.dirCore+'Openings')(app);

console.log('Loading openings');

Openings.importData(function(err, res) {
	if(err) throw err;
	console.log('Openings was loaded: ', res);
	process.exit(0);
});
