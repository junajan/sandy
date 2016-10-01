'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var moment = require("moment");
var config = require("./config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var ydl = require(config.dirLoader+'HistYahoo');

var app = {
  config: config,
  DB: DB
};

app.emit = function(){};
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = function (type) {
  return app.logger.getLogger(type);
};

var Strategy = require(config.dirStrategy+'Strategy90')(app);

var dateFrom = '2000-01-01';
var dateTo = moment();
var ticker = "NEE";

var to = dateTo.format('YYYY-MM-DD');
var from = moment(dateFrom).format('YYYY-MM-DD');

console.log(("Loading "+ticker+" history from "+from +" to " + to).yellow);

ydl.historical({
  symbol: ticker,
  from: from,
  to: to
}, function(err, res) {
  if(err)
    throw err;

  console.log("Days loaded: %d", res.length);
  console.log("First date: %s, Last date: %s", res[0].date, res[res.length - 1].date);

});