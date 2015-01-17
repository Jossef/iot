(function () {
    'use strict';
    var expressPort = 8080;
    var expressIPAddress = '0.0.0.0';
    var mqttPort = 1883;
    var mqttIPAddress = '0.0.0.0';
    var mongoDBUrl = 'mongodb://127.0.0.1:27017/IsOccupied';

    var mqtt = require('mqtt');
    var chalk = require('chalk');
    var express = require("express");
    var path = require("path");
    var expressApp = express();
    var http = require('http').Server(expressApp);
    var io = require('socket.io')(http);


    var occupiedCache = {};

    // --------------------------------
    // MQTT

    var mqttBroker = mqtt.createServer(function (client) {
        client.on('connect', function (packet) {
            try {

                client.id = packet.clientId;
                client.connack({returnCode: 0});
            }
            catch (ex) {
                console.log(chalk.bold.red('ERROR'), ex);
            }
        });

        client.on('publish', function (packet) {
            try {
                var data = JSON.parse(packet.payload);
                occupiedCache[client.id] = data.occupied;
                console.log(chalk.bold.cyan('INCOMING'), client.id, '->', chalk.cyan(packet.payload));

                io.emit('message', packet.payload);
            }
            catch (ex) {
                console.log(chalk.bold.red('ERROR'), ex);
            }

        });
    });

    // --------------------------------
    // Mongo DB

    var mongoClient = require('mongodb').MongoClient;

    var db = mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(chalk.red(err));
        }
        else {

            console.log(chalk.bold.green('CONNECTED'), 'mongodb', chalk.cyan(mongoDBUrl));

            db.createCollection('history', function (err, collection) {
            });

            var collection = db.collection('history');
            var doc1 = {'hello': 'doc1'};
            var doc2 = {'hello': 'doc2'};
            var lotsOfDocs = [{'hello': 'doc3'}, {'hello': 'doc4'}];

            collection.insert(doc2, {w: 1}, function (err, result) {
            });
            collection.insert(lotsOfDocs, {w: 1}, function (err, result) {
            });
        }
    });

    // --------------------------------
    // Express JS

    // Static files
    expressApp.use('/static/', express.static(path.join(__dirname, 'static')));

    // REST API
    expressApp.get("/api/messages/:id", function (request, response) {

    });

    // Root Page
    expressApp.get("/", function (request, response) {
        response.sendFile(path.join(__dirname, 'static', 'index.html'));
    });


    // --------------------------------
    // Listen
    http.listen(expressPort, expressIPAddress);
    mqttBroker.listen(mqttPort, mqttIPAddress);

    console.log(chalk.bold.yellow('LISTENING'), 'express', chalk.cyan(expressIPAddress), chalk.cyan(expressPort));
    console.log(chalk.bold.yellow('LISTENING'), 'mqtt', chalk.cyan(mqttIPAddress), chalk.cyan(mqttPort));

    process.on('uncaughtException', function (err) {
        // Ignored Purposely (mqtt client disconnection can cause ECONNRESET
    });

})();