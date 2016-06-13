"use strict";

require('colors');
var _ = require('lodash');
// load configuration
var app = {};
var config = require("./config");

var Log = config.logger.getLogger("TEST");

Log.info("INFO");

console.log(config.memLogger.getBuffer());
