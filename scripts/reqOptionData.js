var _ = require('lodash');
var chalk = require('chalk');
var util = require('util');

var config = {
  "clientId": 1,
  "host": "127.0.0.1",
  "port": 4001
}

var ib = new (require('ib'))(config)
  .on('error', (err) => {

    console.log('Error:', err)
  }).on('result', (event, args) => {

    if (!_.includes(['tickEFP', 'tickGeneric', 'tickOptionComputation', 'tickPrice',
        'tickSize', 'tickString'], event)) {
        console.log(event, args)
    }
  }).on('tickEFP', (tickerId, tickType, basisPoints, formattedBasisPoints,
                             impliedFuturesPrice, holdDays, futureExpiry, dividendImpact,
                             dividendsToExpiry) => {
      console.log(
        'TickEFP:', tickerId, tickType, basisPoints, formattedBasisPoints,
        impliedFuturesPrice, holdDays, futureExpiry, dividendImpact,
        dividendsToExpiry
      )
  })
  .on('tickGeneric', (tickerId, tickType, value) => {

      console.log('tickGeneric', tickerId, tickType, value)

  }).on('tickOptionComputation', (tickerId, tickType, impliedVol, delta, optPrice,

                                           pvDividend, gamma, vega, theta, undPrice) => {

    console.log(
      '%s %s%d %s%s %s%s %s%s %s%d %s%s %s%s %s%s %s%d',
      chalk.cyan(util.format('[%s]', ib.util.tickTypeToString(tickType))),
      chalk.bold('tickerId='), tickerId,
      chalk.bold('impliedVol='), ib.util.numberToString(impliedVol),
      chalk.bold('delta='), ib.util.numberToString(delta),
      chalk.bold('optPrice='), ib.util.numberToString(optPrice),
      chalk.bold('pvDividend='), pvDividend,
      chalk.bold('gamma='), ib.util.numberToString(gamma),
      chalk.bold('vega='), ib.util.numberToString(vega),
      chalk.bold('theta='), ib.util.numberToString(theta),
      chalk.bold('undPrice='), undPrice
    );
  }).on('tickPrice', (tickerId, tickType, price, canAutoExecute) => {
    console.log(
      '%s %s%d %s%d %s%s',
      chalk.cyan(util.format('[%s]', ib.util.tickTypeToString(tickType))),
      chalk.bold('tickerId='), tickerId,
      chalk.bold('price='), price,
      chalk.bold('canAutoExecute='), canAutoExecute
    );
  }).on('tickSize', function (tickerId, sizeTickType, size) {
  console.log(
    '%s %s%d %s%d',
    chalk.cyan(util.format('[%s]', ib.util.tickTypeToString(sizeTickType))),
    chalk.bold('tickerId:'), tickerId,
    chalk.bold('size:'), size
  );
}).on('tickString', function (tickerId, tickType, value) {
  console.log(
    '%s %s%d %s%s',
    chalk.cyan(util.format('[%s]', ib.util.tickTypeToString(tickType))),
    chalk.bold('tickerId='), tickerId,
    chalk.bold('value='), value
  );
});



ib.connect();

// Forex
ib.reqMktData(1, ib.contract.option('JNJ', '201801', 130, 'C'), '', false, false);

