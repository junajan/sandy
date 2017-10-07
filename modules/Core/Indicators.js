const _ = require('lodash');
const tAnalysis = require('./TechAnalysis');

exports.sma = function(len, data) {
  let count = 0;

  if (!len) return 0;

  if(data.length < len) {
    console.log("Not enough data for sma("+len+"): ", data.length);
    return false;
  }

  for (let i = 0; i < len; i++)
    count += parseFloat(data[i].close);

  return count / len;
};

exports.rsiWilders = function(len, prices) {
    const pList = prices.slice(0, len + 50).reverse();
    const rsi = tAnalysis.rsi(_.map(pList, 'close'), len);
    return (rsi.length) ? rsi.pop() : -1;
}

// var Prices = [ 122.15, 121.48, 122.06, 120.73, 120.87, 120.26, 119.47,
//               118.38, 118.64, 118.83, 117.54, 117.78, 117.09, 116.85];
// var Prices2 = [116.85,117.09,117.78,117.54,118.83,118.64,118.38,119.47,120.26,120.87,120.73,122.06,121.48,122.15];
// var Prices = [122.15, 121.48, 122.06, 120.73, 120.87, 120.26, 119.47, 118.38, 118.64, 118.83, 117.54, 117.78, 117.09, 116.85];
// console.log("RSI2(prices) = ", RSI2(Prices)); //will return 9.43
