
-- compare Equity curve to SPY
SELECT date as date, capital, spyPrice FROM `equity_history` JOIN (SELECT date as dat, close * 200 as spyPrice FROM stock_history_full WHERE symbol='SPY') tmp ON date = dat

-- compare strategy A to SPY
SELECT date, capital, spyPrice FROM `equity_history_stock_picking` JOIN (SELECT date as date2, `close` * 160 as spyPrice FROM stock_history_full WHERE symbol='SPY') tmp ON DATE(date) = DATE(date2) 

-- compare strategy_90_boost to SPY
SELECT date, capital, spyPrice FROM `equity_history_90_boost` JOIN (SELECT date as date2, `close` * 160 as spyPrice FROM stock_history_full WHERE symbol='SPY') tmp ON DATE(date) = DATE(date2) 

-- count win rate
SELECT a.pocet as los, b.pocet as win, a.pocet + b.pocet as sum, a.pocet / (a.pocet + b.pocet) * 100 as los_prcnt, b.pocet / (a.pocet + b.pocet) * 100 as win_prcnt  FROM (SELECT count(*) as pocet FROM `positions` WHERE open_price >= close_price) a JOIN (SELECT count(*) as pocet FROM `positions` WHERE open_price < close_price) b ON 1=1

-- compare equity strategy 90 to equity strategy A
SELECT cap90, capA, e1.date FROM (SELECT DATE(date) as date, capital - 1791 as cap90 FROM `equity_history_90`) as e1 JOIN (SELECT DATE(date) as date, capital - 235 as capA FROM equity_history_stock_picking) as e2 ON e1.date = e2.date 

-- compare equity strategy to equity strategy A
SELECT cap90, capA, e1.date FROM (SELECT DATE(date) as date, capital as cap90 FROM `equity_history`) as e1 JOIN (SELECT DATE(date) as date, capital - 235 as capA FROM equity_history_stock_picking) as e2 ON e1.date = e2.date 

-- compare ALL 
SELECT cap90, cap90_2, capBoost, capEQ, capA, e1.date FROM (SELECT DATE(date) as date, capital as capBoost FROM `equity_history_90_boost`) as e1 JOIN (SELECT DATE(date) as date, capital as capEQ FROM `equity_history`) as e5 JOIN (SELECT DATE(date) as date, capital - 1791 as cap90 FROM `equity_history_90`) as e3 JOIN (SELECT DATE(date) as date, capital as cap90_2 FROM `equity_history_90_2`) as e4 JOIN (SELECT DATE(date) as date, capital - 235 as capA FROM equity_history_stock_picking) as e2 ON e1.date = e2.date AND e2.date = e3.date AND e3.date = e4.date AND e4.date = e5.date
