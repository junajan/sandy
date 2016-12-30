require('colors');
var moment = require("moment");
var Promise = require("bluebird");
var fs = require("fs")
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var app = {
  config, DB
};
var StockHistory = require(config.dirLoader+'StockHistory')(app)

var signals = [
  // ["01.11.1974", 3],
  // ["08.01.1977", 1],
  // ["02.01.1978", 3],
  // ["05.02.1979", 0],
  // ["03.11.1980", 3],
  // ["06.01.1981", 1],
  // ["09.01.1982", 3],
  // ["01.08.1984", 1],
  // ["01.11.1984", 3],
  // ["01.08.1985", 1],
  // ["02.12.1985", 3],
  // ["01.06.1987", 1],
  // ["02.11.1992", 3],
  // ["03.08.1998", 1],
  ["02.11.1998", 3],
  ["02.05.2000", 1],
  ["11.01.2001", 3],
  ["02.05.2002", 1],
  ["01.11.2002", 3],
  ["02.05.2003", 1],
  ["01.12.2003", 3],
  ["07.01.2004", 1],
  ["12.01.2004", 3],
  ["02.05.2005", 1],
  ["01.07.2005", 3],
  ["02.05.2006", 1],
  ["03.11.2008", 3],
  ["03.05.2010", 1],
  ["01.11.2010", 3],
  ["02.05.2011", 0],
  ["03.01.2012", 3],
  ["05.01.2016", 1],
  ["07.01.2016", 3],
  ["29.12.2016", 1]
]

var ticker = "DAX"
ticker = "EWG"

var from = signals[0]
var dateFrom = moment(signals[0][0], "DD.MM.YYYY").format('YYYY-MM-DD')
var dateTo = moment().format('YYYY-MM-DD')
var capital = 20000;
var freeCapital = capital;
var piecesPosition = 0;

function isTradingDate(date) {
  for(var d of signals)
    if(d[0] === date)
      return d;
  return false;
}


var history = fs.readFileSync("./dax.tsv", "utf-8").split("\n")
for(var index in history.reverse()) {
  var p = history[index].split("\t")
  history[index] = {
    date: p[0],
    close: p[1],
    adjClose: p[2]
  }
}

console.log(("Reading "+ticker+" history data from "+dateFrom +" to " + dateTo).yellow);
var promise = Promise.resolve(history)
if(ticker !== "DAX")
  promise = StockHistory.getHistory(ticker, dateFrom, dateTo)

return promise
  .then(data => {
    console.log("INIT CAPITAL: %s", Math.round(capital* 100)/ 100)
    for(var day of data) {
      var date = moment(day.date).format('DD.MM.YYYY')
      var price = moment(day.date).format('DD.MM.YYYY')
      var signal = isTradingDate(date)
      if(!signal)
        continue;

      if(signal[1] > 2) {
        if(piecesPosition)
          continue;

        piecesPosition = parseInt(freeCapital / day.adjClose, 10)
        freeCapital = freeCapital - day.adjClose * piecesPosition
        console.log("%s: BUY  %dx %s for price %s", date, piecesPosition, ticker, day.adjClose)
      } else {
        if(!piecesPosition)
          continue;

        freeCapital += piecesPosition * day.adjClose
        var diff = freeCapital - capital
        var diffPercent = diff / capital * 100
        console.log("%s: SELL %dx %s for price %s (profit %d = %d%)", date, piecesPosition, ticker, day.adjClose, diff, Math.round(diffPercent* 100)/ 100)
        capital = freeCapital
        piecesPosition = 0
      }
    }
    console.log("%s: END CAPITAL: %s", date, Math.round(capital* 100)/ 100)

    console.log("==== END ====")
    process.exit() // TODO remove me
  });