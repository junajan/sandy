# Sandy

An automatic trading bot on steroids..

## What is this repository for?

This project is a simple node.js tool for backtesting and trading various strategies on stock market.
(Currently in production stage)

## Consists of

* Various strategies based on Larry Connors and Grahams approaches
* Backtesting tools for written strategies
* Scheduler for starting strategies at given time
* Cool admin dashboard
* Logger
* Broker connection for paper/live trading
* API serving data for dashboard app
* Robustness testing (in the future)


## Scripts
This repo contains also several commands which are accessible using `npm run` command.

### ReqHistory
Script will test loading of historical prices.
Sample usage:
```bash
node scripts/reqHistory.js 
# will load 10 last days for 99 tickers and print short info

node scripts/reqHistory.js 20 AAPL,MSFT
# will load 20 last days for AAPL and MSFT tickers
```

### Transfers
One can deposit or withdraw requested amount using these commands:
 - `npm run withdraw 1000` - withdraw $1000 (only if there is available cash)
 - `npm run deposit 1000` - deposit $1000

## Contacts
Web: http://janjuna.cz | Mail: mail@janjuna.cz

## Disclaimer
One important thing at the end. This system is not finished. It lacks a lot of important features and thus it should not be used unless you know exactly what you are doing.
If you decide to use this program in any possible way you should keep in your mind that it can generate profits but also big loses and it comes with ABSOLUTELY NO WARRANTY.
