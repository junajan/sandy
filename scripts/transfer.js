'use strict';

/**
 * This will withdraw / deposit selected amount into database
 * It will also show us how an ugly callback hell looks like ;-)
 */

require('colors');
var _ = require("lodash");
var moment = require("moment");
var config = require("../config");
var DB = require(config.dirCore+'Mysql')(config.mysql);
var async = require('async');
var prompt = require('syncprompt');

var allowedCommands = ['deposit', 'withdraw'];
var isWithdrawal = false;

function die(err) {
  console.error('An error occured:'.red, err);
  process.exit(1);
}

function serializeConfig(conf) {
	var out = {};
	conf.forEach(function (item) {
    out[item.var] = item.val;
  })
	return out;
}

if(process.argv.length < 4) {
	die('Two arguments requested: withdraw/deposit and an amount.')
}
var cmd = process.argv[2];
var amount = parseInt(process.argv[3], 10);


if(allowedCommands.indexOf(cmd) < 0)
	die("Unknown command, allowed are %s - exiting", allowedCommands);

if(!amount)
	die("Second agrument must be a withdrawal/deposit amount(number) - exiting");

if(cmd === 'withdraw') {
	isWithdrawal = true;
	amount *= -1;
}

console.log("Running a transfer action with an amount of $%d", amount);

if(isWithdrawal)
	console.log("Checking available amount...");
DB.getData('*', 'config', '`var` IN ("current_capital", "unused_capital", "free_pieces")', function(err, oldConfig) {
	if(err) die(err)
	var config = _.keyBy(oldConfig, 'var');
  var unused = parseInt(config.unused_capital.val, 10);

  if(isWithdrawal && unused < -amount)
  	die('No available cash for withdrawal - only $'+unused+' available');

	console.log('Do you really want to transfer ' + '$%d'.yellow + ' from ' + '$%d'.yellow + ' available?', amount, unused)
  var confirm = prompt('Insert \'y\' to confirm transfer:');
	if(confirm !== 'y')
  	die('Wrong confirmation given - exiting');

	console.log('Running - %s action with $%d'.yellow, cmd, amount);

	var newCapital = Number(config.current_capital.val) + amount;
	var newUnused = Number(config.unused_capital.val) + amount;

  var history = {
    import_id: -1,
		capital: newCapital,
		unused_capital: newUnused,
		free_pieces: config.free_pieces.val
	};

  console.log('Saving new value in equity history')
  DB.insert('equity_history', history, function(err) {
  	if(err) die(err);

  	var withdraw = {
  		amount: amount
		};

  	console.log('Saving new value in transfers')
    DB.insert('transfers', withdraw, function(err) {
    	if(err) die(err);

    	var newConfig = {
        current_capital: newCapital,
        unused_capital: newUnused
			};


      async.each(Object.keys(newConfig), function(key, done) {
        DB.update("config", {val: newConfig[key]}, "var=?", key, done);
      }, function(err) {
      	if(err) die(err);

				console.log("Old configuration: %j", serializeConfig(oldConfig));
				console.log("Current configuration:", newConfig);
      	console.log('Script finished successfully and transfered $%d.'.green, amount);
				process.exit(0);
			});

    });
	});
})

