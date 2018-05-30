'use strict';

require('colors');
const Promise = require("bluebird");
const async = require("async");
const _ = require("lodash");
const moment = require("moment");
const config = require("../config");
const DB = require(config.dirCore+'Mysql')(config.mysql);

const TABLE_POSITIONS = "positions";
// const TABLE_READ = "stock_history_full";
const TABLE_READ = "stock_history_full_alphavantage";
const TABLE_SAVE = "equity_history_real";

function readPositions() {
	return new Promise((resolve, reject) => {
		DB.getData('ticker, amount, open_price, close_price, DATE_FORMAT(open_date, "%Y-%m-%d") as open_date, DATE_FORMAT(close_date, "%Y-%m-%d") as close_date', TABLE_POSITIONS, 'close_date IS NOT NULL ORDER BY open_date ASC', (err, res) => {
			if(err) return reject(err)
			resolve(res)
		})
	})
}

function readEquityHistory() {
	return new Promise((resolve, reject) => {
		DB.getData('DATE_FORMAT(date, "%Y-%m-%d") as date, capital, unused_capital, free_pieces', 'equity_history', '1=1 ORDER BY date ASC', (err, res) => {
			if(err) return reject(err)
			resolve(res)
		})
	})
}

function serializePositions(list) {
	const res = {}

	list.forEach((item) => {
		if(!res[item.ticker])
      res[item.ticker] = []
		res[item.ticker].push(item)
	})
	return res
}

function getMaxCloseDate(list) {
	let max = list[0].close_date

	list.forEach((item) => {

    if(moment(item.close_date).isAfter(max))
    	max = item.close_date
	})

	return max
}

function getDataBoundaries(positions) {
	const boundaries = []
  Object.keys(positions).forEach((ticker) => {
    boundaries.push({
    	ticker: ticker,
			from: positions[ticker][0].open_date,
			to: getMaxCloseDate(positions[ticker]),
		})
	})

	return boundaries
}

//
// CLOSE: 2
// ADJCLOSE: 1
//
// LOW: 2.2
//
// 1 / 2 * 2.2 = 1.1

function readEodData(boundaries) {
	const data = {}

	return Promise.map(boundaries, (item) => {
		return new Promise((resolve, reject) => {
			// DB.getData('adjLow as low, DATE_FORMAT(date, "%Y-%m-%d") as date', TABLE_READ, 'symbol = ? AND date >= ? and date <= ? ORDER BY date ASC', [item.ticker, item.from, item.to], (err, res) => {
			DB.getData('adjClose / close * low as low, adjClose / close * high as high, DATE_FORMAT(date, "%Y-%m-%d") as date', TABLE_READ, 'symbol = ? AND date >= ? and date <= ? ORDER BY date ASC', [item.ticker, item.from, item.to], (err, res) => {
				if(err) return reject(err)
				data[item.ticker] = res
				resolve()
			})
		})
	}, { concurrency: 5})
		.return(data)
}

function incDate(date) {
	return moment(date).add(1, 'day').format('YYYY-MM-DD')
}

function getDateDiff(from, to) {
	from = moment(from)
	to = moment(to)

  return to.diff(from, 'days')
}

function getHistoryOnDate(history, date) {
	return _.find(history, ['date', date])
}

function processPositionDate(pos, date, history, isLast = false) {
  const eod = getHistoryOnDate(history, date)

	if(eod) {
		const origPrice = (isLast ? pos.close_price : pos.open_price) * pos.amount
		const currentPriceLow = pos.amount * eod.low
		const currentPriceHigh = pos.amount * eod.high

		// console.log("Price change for %s from %s to %s on %s", pos.ticker, origPrice, currentPriceLow, date)
		updatedEquity[date].equityLow = updatedEquity[date].equityLow - origPrice + currentPriceLow
		updatedEquity[date].equityHigh = updatedEquity[date].equityHigh - origPrice + currentPriceHigh
	}
}

function processPosition(ticker, position) {
	const history = data[ticker]
	position.forEach((pos) => {
		let date = pos.open_date
    while(getDateDiff(date, pos.close_date) >= 0) {
			// console.log('Processing date %s', date)
			processPositionDate(pos, date, history, date === pos.close_date)
			date = incDate(date)
		}
	})

}

function processPositions() {
	for (let [ticker, pos] of Object.entries(positions)) {
    console.log("Processing %d positions on ticker %s", pos.length, ticker)
		processPosition(ticker, pos)
	}
}

function cleanDb() {
	return new Promise((resolve, reject) => {
		DB.delete(TABLE_SAVE, '1=1', (err, res) => {
			if(err) return reject(err)
			resolve(res)
		})
	})
}

function saveUpdatedEquity() {
	return Promise.map(equity, (item) => {
		const data = updatedEquity[item.date]

    return new Promise((resolve, reject) => {
			DB.insert(TABLE_SAVE, data, (err) => {
				if(err) return reject(err)
				resolve()
			})
		})
	}, { concurrency: 5 })
}


function fetchMaxDrawdown() {
	return new Promise((resolve, reject) => {
		DB.sql(`
			SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as date, (lowerLaterCapital - equityLow) / equityLow * -100 as dd 
				FROM (SELECT date, equityLow, 
					(SELECT MIN(equityLow) FROM equity_history_real el WHERE el.date > eh.date) as lowerLaterCapital 
				FROM equity_history_real as eh) as tmp 
			WHERE 
				lowerLaterCapital IS NOT NULL AND lowerLaterCapital < equityLow 
			ORDER BY dd DESC LIMIT 20`, null, (err, res) => {
			if(err) return reject(err)
			resolve(res)
		})
	})
}

let data = {}
let equity = []
let positions = []
let updatedEquity = {}

console.log('Cleaning real equity table')
cleanDb()
	.then(async () => {
    console.log('Fetching closed positions')
		const res = await readPositions()
    console.log('Fetched %d positions', res.length)
		positions = serializePositions(res)

		console.log('Calculating boundaries before fetching EOD prices')
    const boundaries = getDataBoundaries(positions)
    console.log('Fetching EOD prices for %d tickers', boundaries.length)

    data = await readEodData(boundaries)
		equity = await readEquityHistory()

    // positions = {
    	// KHC: positions.KHC
		// }

		for(const item of equity)
			updatedEquity[item.date] = {
    		date: item.date,
				equityHigh:  item.capital,
				equityLow:  item.capital,
				equityOriginal:  item.capital,
				freePieces:  item.free_pieces,
        unusedCapital:  item.unused_capital,
      }

		await processPositions()

		// console.log(updatedEquity)
		// console.log(positions)
		// process.exit() // TODO remove me
		await saveUpdatedEquity()

		console.log("Fetch max open drawdown")
		const maxDD = await fetchMaxDrawdown()
    if(maxDD.length)
      maxDD.forEach((dd) => {
        console.log("%s: loss %d = %d%",
          dd.date, dd.equityLow - dd.lowerLaterCapital, dd.dd)
      })
    else
      console.log(" .. no DD")
	})
	.then(() => console.log(" === DONE === "))
	.catch((err) => {
		console.error(err)
	})