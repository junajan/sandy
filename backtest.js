"use strict";
/**
 * This is Sandy!
 * Sandy is a Node.JS tool for backtesting and automatic online trading on stock markets
 */

require('colors');
const _ = require("lodash");
const moment = require("moment");

// load configuration
let config = require("./config");

// load and start web server
const server = require(config.dirWeb+'Server');

const app = server.run(config);
require("./config/app")(app, config);
app.DB = require(config.dirCore+'Mysql')(config.mysql);
app.mailer = require(config.dirCore+'Mailer')(app);

const Strategy = require(config.dirStrategy+'GMR')(app);
const Backtest = require(config.dirCore+'Backtest')(Strategy);
const Log = app.logger.getLogger("APP");

require(config.dirWeb+'Routes')(app);

const tickers = "MDY,IEV,EEM,ILF,EPP,EDV,SHY".split(",");

Log.info("Running Backtest");

config = {
  tickers: tickers,
  from: '2011-01-01',
  to: moment().format('YYYY-MM-DD'),
  capital: 20000,
  mailLog: false
};

Backtest.wipe(config)
  .then(() => Backtest.run(config))
  .catch(err => console.error(err));