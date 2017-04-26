'use strict';

/**
 * This will import historical data to Mysql table
 */

require('colors');
const Promise = require("bluebird");
const async = require("async");
const _ = require("lodash");
const moment = require("moment");
const config = require("../config");
const DB = require(config.dirCore+'Mysql')(config.mysql);



const TABLE_POSITIONS = "positions";
const TABLE_READ = "stock_history_full_quandl";
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

function readEodData(boundaries) {
	const data = {}

	return Promise.map(boundaries, (item) => {
		return new Promise((resolve, reject) => {
			DB.getData('adjLow as low, DATE_FORMAT(date, "%Y-%m-%d") as date', TABLE_READ, 'ticker = ? AND date >= ? and date <= ? ORDER BY date ASC', [item.ticker, item.from, item.to], (err, res) => {
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

function processPositionDate(pos, date, history) {
  const eod = getHistoryOnDate(history, date)

	if(eod) {
		const buyPrice = pos.open_price * pos.amount
		const currentPrice = pos.amount * eod.low

		// console.log("Price change from %s to %s on %s", buyPrice, currentPrice, date)
		updatedEquity[date].capital -= buyPrice - currentPrice
	}
}

function processPosition(ticker, position) {
	const history = data[ticker]
	position.forEach((pos) => {
		let date = pos.open_date
		do {
			// console.log('Processing date %s', date)

			processPositionDate(pos, date, history)
			date = incDate(date)
		} while(getDateDiff(date, pos.close_date) >= 0)
	})
}

function processPositions() {
	return Object.keys(positions).forEach((ticker) => {
		const pos = positions[ticker]
    console.log("Processing %d positions on ticker %s", pos.length, ticker)
		processPosition(ticker, pos)
	})
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

		data.original_capital = item.capital
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
			SELECT *, (lowerLaterCapital - capital) / capital * -100 as dd 
				FROM (SELECT date, capital, 
					(SELECT MIN(capital) FROM equity_history_real el WHERE el.date > eh.date) as lowerLaterCapital 
				FROM equity_history_real as eh) as tmp 
			WHERE 
				lowerLaterCapital IS NOT NULL AND lowerLaterCapital < capital 
			ORDER BY dd DESC LIMIT 10`, null, (err, res) => {
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
	.then(() => {
    console.log('Fetching closed positions')
    return readPositions()
  })
	.then((res) => {
		positions = serializePositions(res)
		console.log('Fetched %d positions', res.length)
		console.log('Calculating boundaries before fetching EOD prices')
		return getDataBoundaries(positions)
	})
	.then((boundaries) => {
		console.log('Fetching EOD prices for %d tickers', boundaries.length)
		return readEodData(boundaries)
	})
	.then((res) => {
		data = res
		return readEquityHistory()
	})
	.then((res) => {
		equity = res

		for(const item of equity)
			updatedEquity[item.date] = _.clone(item)

		return processPositions()
	})
	.then(() =>
		saveUpdatedEquity()
	)
	.then(() => {
		console.log("Fetch max open drawdown")
		return fetchMaxDrawdown()
	})
	.then((maxDD) => {
    if(maxDD.length)
      maxDD.forEach((dd) => {
        console.log("%s: loss %d = %d%",
          dd.date, dd.capital - dd.lowerLaterCapital, dd.dd)
      })
    else
      console.log(" .. no DD")
	})
	.then(() => console.log(" === DONE === "))
	.catch((err) => {
		console.error(err)
	})