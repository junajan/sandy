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

  var addon = require('ibapi'),
    messageIds = addon.messageIds,
    contract = addon.contract,
    order = addon.order;


    // The api object handles the client methods. For details, refer to 
    //  IB API documentation.
    var api = new addon.NodeIbapi();

    // Interactive Broker requires that you use orderId for every new order
    //  inputted. The orderId is incremented everytime you submit an order.
    //  Make sure you keep track of this.
    var orderId = -1;

    var getContract = function(ticker) {
      var cntrct = contract.createContract();
      cntrct.symbol = ticker;
      cntrct.secType = 'STK';
      cntrct.exchange = 'SMART';
      cntrct.primaryExchange = 'NASDAQ';
      cntrct.currency = 'USD';
      return cntrct;
    };

    var getOrder = function(action, quantity, type) {
      var ordr = order.createOrder();
      ordr.action = action;
      ordr.totalQuantity = quantity;
      ordr.orderType = type;
      
      return ordr;
    };

    var createMarketOrder = function(orderId) {
      api.placeOrder(orderId, getContract("SPY"), getOrder("BUY", 1, "MKT"));
    };

    var handleValidOrderId = function (message) {
      orderId = message.orderId;
      console.log('Next order Id is ' + orderId);

      createMarketOrder(orderId);
    };

    var handleServerError = function (message) {
      console.log('Error: ' + message.id.toString() + '-' +
                  message.errorCode.toString() + '-' +
                  message.errorString.toString());
    };

    var handleClientError = function (message) {
      console.log('clientError');
      console.log(JSON.stringify(message));
    };

    var handleDisconnected = function (message) {
      console.log('disconnected');
      process.exit(1);
    };

    var handlePositions = function(pos) {
      console.log(pos);
    };

    var handleOpenOrders = function(pos) {
      console.log(pos);
    };

    var handleOpenOrdersEnd = function(pos) {
      console.log(pos);
      delete api.handlers[messageIds.openOrdersEnd];
    };

    var handlePositionsEnd = function(pos) {
      console.log("END");
      delete api.handlers[messageIds.positionsEnd];
    };

    // After that, you must register the event handler with a messageId
    //  For list of valid messageIds, see messageIds.js file.
    api.handlers[messageIds.nextValidId] = handleValidOrderId;
    api.handlers[messageIds.svrError] = handleServerError;
    api.handlers[messageIds.clientError] = handleClientError;
    api.handlers[messageIds.disconnected] = handleDisconnected;

    // api.handlers[messageIds.positions] = handlePositions;
    // api.handlers[messageIds.positionsEnd] = handlePositionsEnd;
    // api.handlers[messageIds.openOrders] = handleOpenOrders;
    // api.handlers[messageIds.openOrdersEnd] = handleOpenOrdersEnd;

    // Connect to the TWS client or IB Gateway
    var connected = api.connect('127.0.0.1', 7496, 0);
    // Once connected, start processing incoming and outgoing messages
    if (connected) {
      api.beginProcessing();
    } else {
      return console.log("Can't connect to IB API");
    }

    // setTimeout(function() {
    //   api.reqOpenOrders();
    // }, 4000);

  return this;
}

var o = null;
module.exports = function(app) {
  return new IB(app);
}