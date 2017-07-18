var moment = require("moment");
var async = require("async");
var stripAnsi = require("strip-ansi");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var Mailer = function(app) {
	var self = this;
	var Log = app.getLogger("MAILER");
	var config = app.config;
	var emailConf = config.email;
	var smsConf = config.sms;

	var apiDisconnectSent = false

	function getFullDate(d) {
		return d.format("YYYY-MM-DD HH:mm:ss");
	}

	this.sendDailyLog = function(log) {
		if(!emailConf.dailyLog)
			return false;

		log = log.replace(/^.*\[DEBUG\].*$/mg, "");
		log = log.replace(/^.*\[TRACE\].*$/mg, "");
		log = log.trim().replace(/\n\n\n*/g, "\n");

		var title = config.env+" sandy daily log";
		var msg = '<b>Sandy bot - daily log for '+getFullDate(moment())+"</b>";

		msg += '<br /><br />';
		msg += stripAnsi(log).replace(/^.*\[DEBUG\].*$/mg, "");

		Log.info('Sending daily log by email');
		self.send(title, msg, null, true);
	};

	this.send = function(title, text, email, isHtml) {
		email = email || emailConf.email;
		if(!emailConf.enabled)
			return false;

		var transport = nodemailer.createTransport();
		var mailConfig = {  //email options
			from: emailConf.from, // sender address.  Must be the same as authenticated user if using Gmail.
			to: email, // receiver
			subject: title,
			text: text
		};

		if(isHtml) mailConfig.html = text;
		else mailConfig.text = text;

		transport.sendMail(mailConfig, function(err, res){  //callback
			if(err){
			   console.error(err);
			}
		});
	};

	this.sendSms = function(text) {
    var email = smsConf.to;
    var title = smsConf.subject;
    var opts = {};

    if(smsConf.gmail) {
      opts = smtpTransport({
        service: 'gmail',
        auth: {
          user: smsConf.gmail.user,
          pass: smsConf.gmail.pass
        }
      })
    }

    if(smsConf.smtp) {
      opts = smtpTransport({
        port: smsConf.smtp.port,
        host: smsConf.smtp.host,
        auth: {
          user: smsConf.smtp.user,
          pass: smsConf.smtp.pass
        }
      })
    }

    var transport = nodemailer.createTransport(opts);

    var mailConfig = {  //email options
      from: smsConf.from,
      to: email,
      subject: title,
      text: text
    };

    transport.sendMail(mailConfig)
      .then(function (res) {
        console.log(res)
      })
      .catch(function (err) {
        console.error(err)
      })
	}

	this.sendDailySmsLog = function (text) {
		if(!smsConf.enabled)
			return false;

		Log.info('Sending SMS notice');
		// max text len 48 characters
		self.sendSms(text)
	};

	this.sendStartMessage = function() {
		var title = config.env+" sandy was stared";
		var msg = 'Sandy bot was started at '+getFullDate(moment());

		Log.info('Sending welcome email');
		self.send(title, msg);
	};

	this.sendLateStartErrorMessage = function(info) {
		var title = config.env+" sandy was started too late!";
		var msg = 'Sandy bot was started too late!'
					+ '\n\tIt was started at: '+getFullDate(info.now)
					+ '\n\tStrategy init was at: '+getFullDate(info.timeStrategyInit)
					+ '\n\tClosing is at: '+getFullDate(info.timeClose);

		self.send(title, msg);
	};

	this.sendApiDisconnect = function(state) {
		var title = config.env+" sandy API disconnect";
		var msg = 'Sandy bot API disconnect event occurred';

		if(state.ib)
			return apiDisconnectSent = false

		// do not send alert more than once
		if(apiDisconnectSent)
			return

    Log.warn('Sending API disconnect alert');
		apiDisconnectSent = true
		self.sendSms(msg)
    self.send(title, msg);
	};

	this.sendSplitCheckerWarning = function (stocks) {
    var title = config.env+" sandy hit splitChecker!";
    var msg = 'Sandy bot triggered splitChecker for following stocks:'

		stocks.forEach(function (stock) {
			msg += 'Stock: '+stock.ticker
				+' | actual price: '+stock.actualPrice
				+'('+stock.actualDate
				+') | old price: '+stock.price
				+'('+stock.date+') | diffPercent: '+stock.diffPercent+'%\n'
    })

    self.send(title, msg);
  }

	app.on('event:error_late_start', this.sendLateStartErrorMessage);
	app.on('event:warn_split_checker', this.sendSplitCheckerWarning);
	app.on('API.connection', this.sendApiDisconnect);
	this.sendStartMessage();
	return this;
};


module.exports = function(app) {
	return new Mailer(app);
};

