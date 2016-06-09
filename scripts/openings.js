'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var config = require("../config");

var DB = require(config.dirCore+'Mysql')(config.mysql);
var Openings = require(config.dirCore+'Openings')({config: config, DB: DB});

console.log('Loading openings');

Openings.importData(function(err, res) {
	if(err) throw err;
	console.log('Openings was loaded: ', res);
	process.exit(0);
});
