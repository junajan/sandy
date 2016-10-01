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

var app = server.run(config);
require("./config/app")(app, config);
app.DB = require(config.dirCore+'Mysql')(config.mysql);
app.mailer = require(config.dirCore+'Mailer')(app);

var Strategy = require(config.dirStrategy+'Strategy90')(app);
var Backtest = require(config.dirCore+'Backtest')(Strategy);
var Log = app.logger.getLogger("APP");

var Robot;

console.warn('File app.js is deprecated and will be removed soon - one of backets,robot,singleRun files should be used'.yellow);
require(config.dirWeb+'Routes')(app);

var tickers = "AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
// tickers = "SPY".split(",");

const PROCESS_LOAD_DELAY = 120000;

if(process.env.NODE_ENV === "RUN_STRATEGY") {
	Log.info("Running strategy");

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

} else if(config.runBacktest) {
	Log.info("Running Backtest");

	config = {
		tickers: tickers,
		// from: "2015-01-01",
		from: '2016-08-01',
		// to: '2016-01-01',
		// to: '2015-10-15',
		to: moment().format('YYYY-MM-DD'),
		capital: 10000 * 2,
		monthlyAdd: 0,
		mailLog: false,
		feesDisabled: false,
		processingDelay: false
		// processingDelay: 10000
	};

	Backtest.wipe(config, function() {
		Backtest.run(config, function(){}, function(){});
	});

} else if(config.runStrategy) {
	Log.info("Running strategy");

	config = {
		// internalHistorical: true,
		internalHistory: true,
		disabledLoadingActualsFromDb: true,
		date: moment(),
		tickers: tickers
	};

	console.time("Initing finished");
	Strategy.init(config, function(err, res) {
		if(err) return Log.error("Strategy init returned error:", err);
		console.timeEnd("Initing finished");

		setTimeout(function(){

			Log.info(("Running strategy at:"+ moment().format('LT')).green);
			console.time("Processing finished");

			Strategy.process(res, function(err, res) {
				console.timeEnd("Processing finished");
				if(err) Log.error("Strategy process returned error:", err);
			});
		}, PROCESS_LOAD_DELAY);
	});
} else if(config.runScheduler) {

	Log.info("Running scheduler for automated trading");

	Robot = require(config.dirCore+"Robot")(app);
	Robot.setStrategy(Strategy);
	Robot.start(Strategy);

} else {

	Log.info("Unspecified operation - set in config one of runScheduler/runBacktest/runStrategy to true");
	process.exit(1);
}

