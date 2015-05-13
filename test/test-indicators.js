var assert = require("assert");
var tAnalysis = require('../modules/Indicators.js');

var testData = [122.15, 121.48, 122.06,
        120.73, 120.87, 120.26, 119.47,
        118.38, 118.64, 118.83, 117.54,
        117.78, 117.09, 116.85];

var testData2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

describe('Indicators', function(){
  describe('RSI2(14)', function(){
    it('should return 9.43', function(){
      assert.equal(tAnalysis.rsi2(14, testData).toFixed(2), 9.43);
    });
  });

  describe('RSI2(14) ascending data', function(){
    it('should return 100', function(){
      assert.equal(tAnalysis.rsi2(14, testData2).toFixed(2), 100);
    });
  });

  describe('SMA(5)', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(tAnalysis.sma(5, testData).toFixed(2), 9.43);
    });
  });

  describe('RSI2(14)', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(tAnalysis.sma(200, testData).toFixed(2), 9.43);
    });
  });

});