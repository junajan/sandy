'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
var async = require("async");
var Promise = require("bluebird");
var request = require("request-promise");
var _ = require("lodash");
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var ydl = require(config.dirLoader+'HistYahoo');

var app = {
	config: config,
	DB: DB,
	emit: _.noop
};

const URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&apikey=${config.alphaVantageKey}&outputsize=full&datatype=json&&symbol=`

config.disabledOrders = true;
app.logger = config.logger;
app.memLogger = config.memLogger;
app.getLogger = function (type) {
	return app.logger.getLogger(type);
};

var Strategy = require(config.dirStrategy+'Strategy90')(app);

const RUN = true;
const _TABLE = "stock_history_full_alphavantage";

var tickers = "AAPL,ABBV,ABT,ACN,AGN,AIG,ALL,AMGN,AMZN,AXP,BA,BAC,BIIB,BK,BLK,BMY,C,CAT,CELG,CHTR,CL,CMCSA,COF,COP,COST,CSCO,CVS,CVX,DD,DHR,DIS,DOW,DUK,DWDP,EBAY,EMR,EXC,F,FB,FDX,FOXA,GD,GE,GILD,GM,GOOG,GS,HAL,HD,HON,HPQ,IBM,INTC,JNJ,JPM,KHC,KMI,KO,LLY,LMT,LOW,MA,MCD,MDLZ,MDT,MET,MMM,MO,MON,MRK,MS,MSFT,NEE,NKE,ORCL,OXY,PCLN,PEP,PFE,PG,PM,PYPL,QCOM,RTN,SBUX,SLB,SO,SPG,T,TGT,TSLA,TWX,TXN,UNH,UNP,UPS,USB,UTX,V,VZ,WBA,WFC,WMT,XOM".split(",");

async function downloadHistory(ticker) {
	console.log("Downloading data for ", ticker)
	const tickerUrl = URL+ticker


  const is = await isInDatabase(ticker)
	if(is)
		return {
			[ticker]: 'preserved'
		}

  const res = await request.get(tickerUrl)
	let feed = JSON.parse(res)
  feed = feed && feed['Time Series (Daily)']
	if(!feed) {
		console.error('Error when downloading data for %s'.red, ticker, res)
		return {
			[ticker]: -1
		}
	}

	const data = []
	for(let [date, eod] of Object.entries(feed)) {

    // id	symbol	date	import_id	open	high	low	close	adjClose	volume
    data.push([
      0,
			date,
			eod['1. open'],
			eod['2. high'],
			eod['3. low'],
			eod['4. close'],
			eod['6. volume'],
			eod['5. adjusted close'],
			ticker
  	])
	}

	await truncate(ticker);
	return saveData(ticker, data);
}

async function truncate(ticker) {
	return new Promise((resolve, reject) => {
		DB.delete(
			_TABLE, 'symbol = ?', ticker, (err) => {
				if(err)
					reject(err)
				else
					resolve()
			});
	})
}

async function isInDatabase(ticker) {
  return new Promise((resolve, reject) => {
    DB.get('id', _TABLE, 'symbol = ?', ticker, (err, res) => {
    	if(err)
				reject(err)
			else
				resolve(!!res)
		})
  })
}

async function saveData(ticker, data) {
	if(data.length)
		await new Promise((resolve, reject) => {
			DB.insertValues(
				_TABLE+' (import_id, date, open, high, low, close, volume, adjClose, symbol)', data, (err) => {
					if(err)
						reject(err)
					else
						resolve()
				});
		})

  return {
    [ticker]: data.length
  }
}

if(RUN) {
	Promise.map(tickers, downloadHistory, { concurrency: 2 })
		.then((res) => {
			console.log("Finished")
			console.log(res)
		})
}
