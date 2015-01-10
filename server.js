'use strict';
/**
 * Module dependencies.

var init = require('./config/init')(),
	config = require('./config/config'),
	mongoose = require('mongoose'),
	chalk = require('chalk');
/**
 * Main application entry file.
 * Please note that the order of loading is important.


// Bootstrap db connection
var db = mongoose.connect(config.db, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});
// Init the express application
var app = require('./config/express')(db);

// Bootstrap passport config
require('./config/passport')();

// Start the app by listening on <port>
app.listen(config.port);

// Expose app
exports = module.exports = app;

// Logging initialization
console.log('MEAN.JS application started on port ' + config.port);

*/

var mqtt = require('mqtt');

mqtt.createServer(function(client) {
	var self = this;

	if (!self.clients) self.clients = {};

	client.on('connect', function(packet) {

		console.log('new client!', packet);

		client.connack({returnCode: 0});
		client.id = packet.clientId;
		self.clients[client.id] = client;
	});

	client.on('publish', function(packet) {
		for (var k in self.clients) {
			self.clients[k].publish({topic: packet.topic, payload: packet.payload});
		}
	});

	client.on('subscribe', function(packet) {
		var granted = [];
		for (var i = 0; i < packet.subscriptions.length; i++) {
			granted.push(packet.subscriptions[i].qos);
		}

		client.suback({granted: granted, messageId: packet.messageId});
	});

	client.on('pingreq', function(packet) {
		client.pingresp();
	});

	client.on('disconnect', function(packet) {
		client.stream.end();
	});

	client.on('close', function(err) {
		delete self.clients[client.id];
	});

	client.on('error', function(err) {
		console.log('error!', err);

		if (!self.clients[client.id]) return;

		delete self.clients[client.id];
		client.stream.end();
	});
}).listen(1883, '0.0.0.0');

/*
console.log('hi!');

var client = mqtt.createClient();
console.log('hi!');

client.subscribe('messages');
client.publish('messages', 'hello me!');
client.on('message', function(topic, message) {
	console.log(message);
});
client.options.reconne*/ctPeriod = 0;