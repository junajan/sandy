const _ = require('lodash');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));

class AlphaVantage {
  constructor (config) {
    this.config = config;
  }

  _getLastPriceUrl (ticker) {
    const { tokens } = this.config;
    const token = _.sample(tokens);

    return `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${token}`;
  }

  async _callApi (url) {
    const conf = {
      url: url,
      json: true
    };

    try {
      return request.getAsync(conf)
    } catch (err) {
      console.error('AlphaVantage :: Error while fetching API', err);
      return;
    }
  }

  async getLastPrices (_tickers) {
	  const tickers = Array.isArray(_tickers)
      ? _tickers
      : [_tickers];

    const responses = await Promise.map(tickers, async (ticker) => {
      const url = this._getLastPriceUrl(ticker);
      const { body } = await this._callApi(url);

      return {
        price: body['Global Quote']['05. price'],
        ticker,
      };
    }, { concurrency: 1 });

    console.log(responses)
    const priceByTicker = responses.reduce((all, item) => {
      if (!item) {
        return all;
      }

      return {
        ...all,
        [item.ticker]: item.price,
      }
    }, {});

    return priceByTicker;
  }
}

module.exports = AlphaVantage;
