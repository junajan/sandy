'use strict';
require('colors');

var _ = require('lodash');
var moment = require('moment');
var ibApi = require("ib");
var util = require('util');
var lastClientId = 0;

function IB(app) {
	var self = this;
	var IB = null;

	this.connect = function(id) {
		console.log("Connecting to IB API with clientId: ", id);
		
		var conf = _.cloneDeep(app.get("conf").ibApi);
		conf.clientId = id;

		IB = (new ibApi(conf)).on('error', function(err) {
			
			console.error(err.message.red, err);
		}).on('result', function(event, args) {

			console.log("IB API ("+moment.unix(Date.now()).format('hh:mm:ss')+"):", (event).yellow, JSON.stringify(args));
		// }).on('result', function(event, args) {
			// if (!_.contains(['tickEFP', 'tickGeneric', 'currentTime', 'tickOptionComputation', 'tickPrice',
			// 		'tickSize', 'tickString'
			// 	], event)) {
			// 	console.log('%s: %s', (event).yellow, JSON.stringify(args));
			// }
		}).on('currentTime', function(time) {
			console.log(
				'%s %s%s',
				'[currentTime]'.cyan,
				'time='.bold, moment.unix(time).format('YYYY-MM-DD hh:mm:ss A')
			);
		});

		IB.connect(1, 7496);
		// // Stock
		// IB.reqMktData(12, IB.contract.stock('AMZN'), '', false);

		function placeOrder(id) {
			console.log("Placing order", id);
			IB.placeOrder(
			    id,
			    IB.contract.stock('AAPL'),
			    IB.order.limit('BUY', 2)// safe, unreal value used for demo
  			);
		};
		IB.once("nextValidId", placeOrder).reqIds(2);
		// setTimeout(function() {
		// 		console.log('Cancelling market data subscription...'.yellow);
				// //Stock
				// ib.cancelMktData(12);
		// }, 5000);
	
		// IB.reqPositions();
	
	};

	this.disconnect = function() {
		IB.disconnect();
	};

	this.getTime = function() {

		IB.reqCurrentTime();
		setTimeout(self.getTime, 5000);
	};

	this.getPositions = function() {

	};

	this.getOrders = function() {

	};

	this.getMktData = function() {
		(new ibApi(app.get("conf").ibApi)).on('result', function(event, args) {
			if (!_.contains(['tickEFP', 'tickGeneric', 'tickOptionComputation', 'tickPrice',
					'tickSize', 'tickString'
				], event)) {
				console.log('%s %s', (event + ':').yellow, JSON.stringify(args));
			}
		}).on('tickEFP', function(tickerId, tickType, basisPoints, formattedBasisPoints,
			impliedFuturesPrice, holdDays, futureExpiry, dividendImpact,
			dividendsToExpiry) {
			console.log(
				'%s %s%d %s%d %s%s %s%d %s%d %s%s %s%d %s%d',
				util.format('[%s]', IB.util.tickTypeToString(tickType)).cyan,
				'tickerId='.bold, tickerId,
				'basisPoints='.bold, basisPoints,
				'formattedBasisPoints='.bold, formattedBasisPoints,
				'impliedFuturesPrice='.bold, impliedFuturesPrice,
				'holdDays='.bold, holdDays,
				'futureExpiry='.bold, futureExpiry,
				'dividendImpact='.bold, dividendImpact,
				'dividendsToExpiry='.bold, dividendsToExpiry
			);
		}).on('tickGeneric', function(tickerId, tickType, value) {
			console.log(
				'%s %s%d %s%d',
				util.format('[%s]', IB.util.tickTypeToString(tickType)).cyan,
				'tickerId='.bold, tickerId,
				'value='.bold, value
			);
		}).on('tickOptionComputation', function(tickerId, tickType, impliedVol, delta, optPrice,
			pvDividend, gamma, vega, theta, undPrice) {
			console.log(
				'%s %s%d %s%s %s%s %s%s %s%d %s%s %s%s %s%s %s%d',
				util.format('[%s]', IB.util.tickTypeToString(tickType)).cyan,
				'tickerId='.bold, tickerId,
				'impliedVol='.bold, IB.util.numberToString(impliedVol),
				'delta='.bold, IB.util.numberToString(delta),
				'optPrice='.bold, IB.util.numberToString(optPrice),
				'pvDividend='.bold, pvDividend,
				'gamma='.bold, IB.util.numberToString(gamma),
				'vega='.bold, IB.util.numberToString(vega),
				'theta='.bold, IB.util.numberToString(theta),
				'undPrice='.bold, undPrice
			);
		}).on('tickPrice', function(tickerId, tickType, price, canAutoExecute) {
			console.log(
				'%s %s%d %s%d %s%s',
				util.format('[%s]', IB.util.tickTypeToString(tickType)).cyan,
				'tickerId='.bold, tickerId,
				'price='.bold, price,
				'canAutoExecute='.bold, canAutoExecute
			);
		}).on('tickSize', function(tickerId, sizeTickType, size) {
			console.log(
				'%s %s%d %s%d',
				util.format('[%s]', IB.util.tickTypeToString(sizeTickType)).cyan,
				'tickerId:'.bold, tickerId,
				'size:'.bold, size
			);
		}).on('tickString', function(tickerId, tickType, value) {
			console.log(
				'%s %s%d %s%s',
				util.format('[%s]', IB.util.tickTypeToString(tickType)).cyan,
				'tickerId='.bold, tickerId,
				'value='.bold, value
			);
		});
		IB.connect();
		// Forex
		IB.reqMktData(1000, IB.contract.forex('EUR'), '', false);
		// IB.reqMktData(2, IB.contract.forex('GBP'), '', false);
		// IB.reqMktData(3, IB.contract.forex('CAD'), '', false);
		// IB.reqMktData(4, IB.contract.forex('HKD'), '', false);
		// IB.reqMktData(5, IB.contract.forex('JPY'), '', false);
		// IB.reqMktData(6, IB.contract.forex('KRW'), '', false);
		// // Stock
		// IB.reqMktData(11, IB.contract.stock('AAPL'), '', false);
		// IB.reqMktData(12, IB.contract.stock('AMZN'), '', false);
		// IB.reqMktData(13, IB.contract.stock('GOOG'), '', false);
		// IB.reqMktData(14, IB.contract.stock('FB'), '', false);
		// // Option
		// IB.reqMktData(21, IB.contract.option('AAPL', '201407', 500, 'C'), '', false);
		// IB.reqMktData(22, IB.contract.option('AMZN', '201404', 350, 'P'), '', false);
		// IB.reqMktData(23, IB.contract.option('GOOG', '201406', 1000, 'C'), '', false);
		// IB.reqMktData(24, IB.contract.option('FB', '201406', 50, 'P'), '', false);
		// Disconnect after 7 seconds.
		// setTimeout(function() {
		// 	console.log('Cancelling market data subscription...'.yellow);
		// 	// Forex
		// 	IB.cancelMktData(1);
		// 	IB.cancelMktData(2);
		// 	IB.cancelMktData(3);
		// 	IB.cancelMktData(4);
		// 	IB.cancelMktData(5);
		// 	IB.cancelMktData(6);
		// 	//Stock
		// 	IB.cancelMktData(11);
		// 	IB.cancelMktData(12);
		// 	IB.cancelMktData(13);
		// 	IB.cancelMktData(14);
		// 	// Option
		// 	IB.cancelMktData(21);
		// 	IB.cancelMktData(22);
		// 	IB.cancelMktData(23);
		// 	IB.cancelMktData(24);
		// });
	}
	// this.connect();
	return this;
}

var o = null;
module.exports = function(app) {
	return new IB(app);
}