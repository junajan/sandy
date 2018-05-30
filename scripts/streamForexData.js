const _ = require('lodash');
const chalk = require('chalk');
const util = require('util');
const ibClient = require('ib');
const moment = require('moment');
const socketIo = require('socket.io');

const io = socketIo({
  serveClient: false,
});

const config = {
  "clientId": 1,
  "host": "127.0.0.1",
  "port": 4001
}

const streamings = {}
let nextValidId = 0

const ib = new ibClient(config)
  .on('error', (err) => {
    if(String(err).includes('Market data farm connection is OK'))
      console.log('[INFO]: %s', err.message.replace('Error: ', ''))
    else
      console.error('[ERROR]:', err)

  }).on('result', (event, args) => {
    const filter = [
      'tickPrice', // catch price in special event
      'tickSize', // ignore size
      'nextValidId',
      'tickGeneric',
    ]

    if (!_.includes(filter, event))
      console.log(event, args)
  })
  .on('nextValidId', (_nextValidId) => {
    nextValidId = _nextValidId
    ib.emit('startProcessing')
  })
  .on('tickPrice', (tickerId, tickType, price, canAutoExecute) => {
    if(_.isUndefined(streamings[tickerId])) {
      console.error('[ERROR]: Unknown id %d', tickerId);
      ib.cancelMktData(parseInt(tickerId));
      return;
    }

    streamings[tickerId].tickPrice(tickType, price)
  })
  .on('startProcessing', () => {
    startStreaming(getStreamForexConfig(nextValidId++, 'USD', 'EUR'))
  });

function getStreamForexConfig (id, currency, symbol) {
  const conf = {
    currency,
    symbol,
    ticker: `${symbol}/${currency}`,
    exchange: 'IDEALPRO',
    secType: 'CASH',
  }

  return {
    type: 'FOREX',
    id,
    conf,
    prices: {},
    lastBid: null,
    lastAsk: null,
    process: function () {
      const decs = 4
      const time = moment().toISOString()
      const tickers = [this.conf.symbol, this.conf.currency]

      if(this.lastBid === null || this.lastAsk === null)
        return;

      const price =  _.round(this.lastAsk, decs)
      const priceReverse =  _.round(1 / this.lastBid, decs)

      this.prices[tickers.join('/')] = {
        time,
        price
      }

      this.prices[tickers.reverse().join('/')] = {
        time,
        price: priceReverse
      }
      console.dir(this.prices)
    },
    tickPrice: function (tickType, price) {
      tickType = ib.util.tickTypeToString(tickType)
      if(tickType === 'ASK')
        this.lastAsk = price
      if(tickType === 'BID')
        this.lastBid = price

      console.log('[DEBUG]: %s %s %f', tickType, this.conf.ticker, price)


      this.process()
    }
  }
}

function startStreaming (config) {
  console.log(
    '[INFO]: Streaming(%d) %s %s/%s',
    config.id,
    config.type,
    config.conf.symbol,
    config.conf.currency
  )

  streamings[config.id] = config
  ib.reqMktData(config.id, config.conf, '', false, false)
}

ib.connect();


