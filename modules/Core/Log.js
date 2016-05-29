var _ = require("lodash");
var moment = require("moment");
var logger = require('log4js').getLogger('Strategy'); 

function o2a(o) {
	return Object.keys(o).map(function(k){return o[k]});
}
function o2s(o, d) {
	return o2a(o).join(d || '');
}

var Log = function(app, conf) {
	var self = this;
	var buffer = [];
	var record = false;
	
	this.time = function() {
		return moment().format("\[DD.MM.YYYY HH:MM:SS.SSS")+"] ";
	};

	this.flushBuffer = function() {
		buffer = [];
	};

	this.startRecording = function() {
		record = true;
	};
	
	this.stopRecording = function() {
		record = false;
	};

	this.addRecord = function(args, type, bold) {
		if(record)
			buffer.push({msg: args, type: type, time: self.time(), bold: bold || false});
	};

	this.getBuffer = function() {
		return buffer;
	};

	this.getSerializedBuffer = function() {
		var str = '';
		buffer.forEach(function(line) {
			var l = line.time+" " +line.msg;

			if(line.bold)
				l = "<b>"+l+"</b>";

			if(line.type == 'error')
				l = '<span style="color: red">'+l+'</span>';
			else if(line.type == 'warning')
				l = '<span style="color: yello">'+l+'</span>';

			str += l + "<br />\n";
		});

		return str;
	};
	
	this.info = function(text, bold) {
		logger.info.call(logger, text);
		
		self.addRecord(text, 'info', bold);
	};
	
	this.warn = function(text, bold) {
		logger.warn.call(logger, text);
		
		self.addRecord(text, 'warning', bold);
	};
	
	this.error = function(text, bold) {
		logger.error.call(logger, text);

		self.addRecord(text, error, bold);
	};
	
	return this;
};

module.exports = function(app, s) {
	return new Log(app, s)
};