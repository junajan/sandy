require('colors');
var async = require("async");
var moment = require("moment");
var server = require('./modules/Server');
var conf = require("./config/public")(server.app);
var app = server.run(conf);
app.set("db",require('./modules/Mysql')(conf.mysql));

require('./routes')(app);

var Strategy = require('./modules/Strategy')(app);
var StrategyStockPicking = require('./modules/StrategyStockPicking')(app);
var StrategySpy = require('./modules/StrategySpy')(app);
var Scheduler = require('./modules/Scheduler');
var HistYahoo = require('./modules/HistYahoo');
var tickers = "SPY,XLF,XLV,XLP,AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
var tickers = "AAPL,ABBV,ABT,ACN,AIG,ALL,AMGN,AMZN,APA,APC,AXP,BA,BAC,BAX,BIIB,BK,BMY,BRK-B,C,CAT,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DIS,DOW,DVN,EBAY,EMC,EMR,EXC,F,FB,FCX,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NKE,NOV,NSC,ORCL,OXY,PEP,PFE,PG,PM,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");
var Backtest = require('./modules/Backtest')(Strategy);
var tickers = "'"+tickers.join("','")+"'";

// HistYahoo.cleanImport(app.get('db'), tickers, console.log);

// var DB = app.get('db');

// console.time('LOADING END');
// DB.getData('date, symbol, close', 'stock_history_full', 'symbol IN('+tickers+')', null, 'date', 'ASC', function(err, res) {
// 	if(err) throw err;

// 	console.log(res.length);
// 	console.timeEnd('LOADING END');
// });

// var config = {
// 	from: "2014-01-01",
// 	to: "2014-03-01",
// 	capital: 20000,
// };

// function reportDay(info) {
// }

// function reportAll(info) {
// }

// Backtest.wipe(config, function() {
// 	Backtest.run(config, reportDay, reportAll);
// });

// Strategy.initClear(config);

var Robot = require("./modules/Robot")(app);
Robot.setStrategy(Strategy);
Robot.start(Strategy);



// Robot.strategyInit(function() {
// 	Robot.strategyProcess();
// });


// // var IB = require('./modules/IBApi2')(app);
// // IB.connect();
// // IB.getTime();
// // IB.disconnect();



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
