
-- compare Equity curve to SPY
SELECT date as date, capital, spyPrice FROM `equity_history` JOIN (SELECT date as dat, close * 200 as spyPrice FROM stock_history_full WHERE symbol='SPY') tmp ON date = dat

-- compare strategy A to SPY
SELECT date, capital, spyPrice FROM `equity_history_stock_picking` JOIN (SELECT date as date2, `close` * 160 as spyPrice FROM stock_history_full WHERE symbol='SPY') tmp ON DATE(date) = DATE(date2) 
