var nodemailer = require('nodemailer');
// send SMS
// send MAIL


var Notify = function(conf) {
	var self = this;

	this.mail = function(subj, text) {
			
		var transporter = nodemailer.createTransport();
		transporter.sendMail({
		    from: conf.from,
		    to: conf.to,
		    subject: subj,
		    text: text
		});
	};

	this.sms = function(subj, text) {
			
		var transporter = nodemailer.createTransport();
		transporter.sendMail({
		    from: conf.from,
		    to: conf.toSMS,
		    subject: subj,
		    text: text
		});
	};

	return this;
};


module.exports = function(conf) {
	return new Notify(conf);
};

