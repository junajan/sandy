var _ = require('lodash');

var config = {
  "clientId": 1,
  "host": "127.0.0.1",
  "port": 4001
}

var ib = new (require('ib'))(config)
  .on('error', function (err) {
    console.error(err.message);
  })
  .on('result', function (event, args) {
    if (!_.includes(['position', 'positionEnd'], event)) {
      console.log('%s %s', (event + ':'), JSON.stringify(args));
    }
  })
  .on('position', function (account, contract, pos, avgCost) {
    console.log(
      '%s %s%s %s%s %s%s %s%s',
      '[position]',
      'account=', account,
      'contract=', JSON.stringify(contract),
      'pos=', pos,
      'avgCost=', avgCost
    );
  })
  .on('positionEnd', function () {
    console.log('[positionEnd]');
  });

ib.connect();
ib.reqPositions();

ib.on('positionEnd', function () {
  ib.disconnect();
});