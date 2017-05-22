"use strict";
/**
 * This is Sandy!
 * Sandy is a Node.JS tool for backtesting and automatic online trading on stock markets
 */

require('colors');
var moment = require("moment");

// load configuration
var config = require("./config");

// load and start web server
var server = require(config.dirWeb+'Server');

var PROCESS_LOAD_DELAY = process.argv[2];

var app = server.run(config);
require("./config/app")(app, config);
app.DB = require(config.dirCore+'Mysql')(config.mysql);
app.mailer = require(config.dirCore+'Mailer')(app);

var Strategy = require(config.dirStrategy+'Strategy90')(app);
var Backtest = require(config.dirCore+'Backtest')(Strategy);
var Log = app.logger.getLogger("APP");

var Robot;

require(config.dirWeb+'Routes')(app);

if(!PROCESS_LOAD_DELAY || PROCESS_LOAD_DELAY < 1000) {
  Log.error("Delay can't be smaller than 30'000ms - value: "+PROCESS_LOAD_DELAY)
  process.exit(1)
}


Log.info("Running strategy with delay %dms", PROCESS_LOAD_DELAY);

Robot = require(config.dirCore+"Robot")(app);
Robot.setStrategy(Strategy);

Robot.strategyInit(function() {
  Log.info("Waiting %dsec to run strategy", PROCESS_LOAD_DELAY / 1000);
  setTimeout(function(){

    Robot.strategyProcess(function() {
      process.exit(0);
    });
  }, PROCESS_LOAD_DELAY);
});
