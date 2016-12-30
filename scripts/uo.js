require('colors');
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var app = {
  config, DB
};
var StockHistory = require(config.dirLoader+'StockHistory')(app)
var closeColumn = 'close';
var ticker = "SPY";

var start = "20.12.2016"

var dateFrom = moment(start, "DD.MM.YYYY").subtract(30, "days").format('YYYY-MM-DD')
var dateTo = moment(start, "DD.MM.YYYY").format('YYYY-MM-DD')

function uo (prices, shortPeriods, mediumPeriods, longPeriods) {
  var avgs = []
  var bpsSum = 0;
  var trsSum = 0;

  for(var i = 0; i < longPeriods; i++) {
    var price = prices[i];
    var prevPrice = prices[i+1];

    bpsSum += price[closeColumn] - Math.min(price.low, prevPrice[closeColumn])
    trsSum += Math.max(price.high, prevPrice[closeColumn]) - Math.min(price.low, prevPrice[closeColumn])

    if([shortPeriods, mediumPeriods, longPeriods].indexOf(i+1) >= 0)
      avgs.push(bpsSum / trsSum)
  }

  return 100 * (4 * avgs[0] + 2 * avgs[1] + avgs[2]) / 7
}


console.log(("Reading "+ticker+" history data from "+dateFrom +" to " + dateTo).yellow);
return StockHistory.getHistory(ticker, dateFrom, dateTo)
  .then(data => {
    // console.log(data)
    data = data.reverse()
    var res = uo(data, 5, 10, 15)

    var date = moment(data[0].date).format("YYYY-MM-DD")
    console.log("%s: UltOsc(5,10,15) =", date, res)
    console.log("===== END =====")
    process.exit() // TODO remove me
  });