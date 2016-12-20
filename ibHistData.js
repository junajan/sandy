var _ = require('lodash');
require('colors');
var len = 0
var ib = new (require('ib'))({
  clientId: 1,
  host: '127.0.0.1',
  port: 4001
}).on('error', function (err) {
  console.error(err.message);
}).on('historicalData', function (reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps) {
  if (_.includes([-1], open)) {
    console.log('endhistoricalData');
  } else {
    len++
    console.log(
      '%s %s%d %s%s %s%d %s%d %s%d %s%d %s%d %s%d %s%d %s%d',
      '[historicalData]'.cyan,
      'reqId='.bold, reqId,
      'date='.bold, date,
      'open='.bold, open,
      'high='.bold, high,
      'low='.bold, low,
      'close='.bold, close,
      'volume='.bold, volume,
      'barCount='.bold, barCount,
      'WAP='.bold, WAP,
      'hasGaps='.bold, hasGaps
    );
  }
});


ib.connect();

var durationStr = '230 D'
console.log(durationStr)
// tickerId, contract, endDateTime, durationStr, barSizeSetting, whatToShow, useRTH, formatDate
ib.reqHistoricalData(2, ib.contract.stock('BIIB','SMART','USD'), '20161219 16:00:00', durationStr, barSizeSetting='1 day',whatToShow='TRADES',useRTH=1,formatDate=1);

ib.on('historicalData', function (reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps) {
  if (_.includes([-1], open)) {
    //ib.cancelHistoricalData(1);  // tickerId
    ib.disconnect();
    console.log("COUNT:", len)
  }
});