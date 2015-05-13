require('colors');
var async = require("async");
var moment = require("moment");
var server = require('./modules/App');
var conf = require("./config/public")(server.app);
var app = server.run(conf);
require('./routes')(app);
app.set("db",require('./modules/Mysql')(conf.mysql));

var Strategy = require('./modules/Strategy')(app);
var StrategyStockPicking = require('./modules/StrategyStockPicking')(app);
var StrategySpy = require('./modules/StrategySpy')(app);
var Scheduler = require('./modules/Scheduler');
var HistYahoo = require('./modules/HistYahoo');
// var Backtest = require('./modules/Backtest')(Strategy);

var config = {
	from: "2010-05-01",
	to: "2015-04-08",
};


function reportDay(info) {
}

function reportAll(info) {
}


var Backtest = require('./modules/Backtest')(Strategy);
Backtest.wipe(function() {
	Backtest.run(config, reportDay, reportAll);
});

// var tickers = "SPY,XLF,XLV,XLP".split(",");
// var importId = 10000;
// HistYahoo.importHistory(app.get('db'), importId, tickers, config.from, config.to, function(err, res) {
// 	console.log(err, res);
// });


// Scheduler.today(11,15, function() {
// 	Strategy.init(function(err, info) {
// 		if(err) return;

// 		Scheduler.today(21,59, function() {
// 			Strategy.process(info);
// 		});
// 	});
// });


// console.time("Initing strategy");
// console.time("Full service");
// Strategy.init(function(err, info) {
// 	if(err)
// 		console.log(err);

// 	console.timeEnd("Initing strategy");
// 	console.time("Procesing strategy");

// 	Strategy.process(info, function(err, res) {
// 		console.timeEnd("Procesing strategy");
// 		console.timeEnd("Full service");
// 	});
// });

// var info = {
// 	import_id: 19,
// 	tickers:['ABT','ACN','AIG','ALL','AMGN','AMZN','APA','APC','AXP','BA','BAC','BAX','BIIB','BK','BMY','BRK-B','C','CAT','CL','CMCSA','COF','COP','COST','CSCO','CVS','CVX','DD','DIS','DOW','DVN','EBAY','EMC','EMR','EXC','F','FB','FCX','FDX','FOXA','GD','GE','GILD','GM','GOOG','GS','HAL','HD','HON','HPQ','IBM','JNJ','JPM','KO','LLY','LMT','LOW','MA','INTC','MCD','MDLZ','MDT','MET','MMM','MO','MON','MRK','MS','MSFT','NKE','NOV','NSC','ORCL','OXY','PEP','PFE','PG','PM','QCOM','RTN','SBUX','SLB','SO','SPG','T','TGT','TWX','TXN','UNH','UNP','UPS','USB','UTX','V','VZ','WFC','WMT','XOM','WBA','AAPL','ABBV'],
// };
// console.time("Full service");
// console.time("Loading Data from DB");
// Strategy.getHistoricalImport(info, function(err, res, data) {
// 	info.data = data;
	
// 	console.timeEnd("Loading Data from DB");
// 	console.time("Procesing strategy");
// 	Strategy.process(info, function(err, res) {
// 		// console.log(err, res);
		
// 		console.timeEnd("Procesing strategy");
// 		console.timeEnd("Full service");
// 	});
// });


// console.time("Full service");
// console.time("Loading Data from DB");
// Strategy.getHistoricalImport(info, function(err, res, data) {
// 	info.data = data;
	
// 	console.timeEnd("Loading Data from DB");
// 	console.time("Procesing strategy");
// 	Strategy.process(info, function(err, res) {
// 		// console.log(err, res);
		
// 		console.timeEnd("Procesing strategy");
// 		console.timeEnd("Full service");
// 	});
// });



// Strategy.getLastImport(function(err, importInfo, importData) {
// 	console.log(err, importInfo, importData);
// });

// var Log = require("./modules/Log")(app, "MAIN");
// var tAnalysis = require('./modules/Indicators');

// var t = tAnalysis.rsi2(14);
// console.log(t);

// var hist = require("./modules/HistYahoo");

// hist.getActual(['SPY', 'MSFT', 'AAPL', 'XLV'], function(res) {
// 	console.log(res);
// });

// var conf = {
// 	from: "aaa@mmm.cz",
// 	toSMS: "721235063@sms.cz.o2.com",
// 	to: "mail@janjuna.cz",
// };
// 

// var noty = require("./modules/Notify")(conf);

// noty.mail("AHOJ", "CAU");

// var etfList = require('./modules/Tickers')();
// etfList.getSP100Barchart(function(err, list) {
// 	console.log(err, list);
// });
