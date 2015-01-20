#!/usr/bin/env node

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
    var webSockets = require('socket.io')(http);
    var mongoClient = require('mongodb').MongoClient;
    var events = require('events');

    var db = {};
    // --------------------------------
    // MQTT


    var mqttBroker = mqtt.createServer(function (mqttClient) {
        mqttClient.on('connect', function (packet) {
            try {
                mqttClient.id = packet.clientId;

                // Send a response ACK
                mqttClient.connack({returnCode: 0});
            }
            catch (ex) {
                errorHandler(ex);
            }
        });

        mqttClient.on('publish', function (packet) {
            try {
                var data = JSON.parse(packet.payload);
                if (data.occupied == undefined) {
                    // Bad input, ignoring
                    return;
                }
                console.log(chalk.bold.cyan('INCOMING'), mqttClient.id, '->', chalk.cyan(packet.payload));
                onDeviceOccupationUpdate(mqttClient.id, data.occupied)
            }
            catch (ex) {
                errorHandler(ex);
            }

        });
    });

    // --------------------------------
    // Mongo DB


    mongoClient.connect(mongoDBUrl, function (err, mongoContext) {
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(chalk.red(err));
        }
        else {

            console.log(chalk.bold.green('CONNECTED'), 'mongodb', chalk.cyan(mongoDBUrl));

            mongoContext.createCollection('devices', errorHandler);
            db.devices = mongoContext.collection('devices');

        }
    });


    // --------------------------------
    // Express JS

    // Static files
    expressApp.use('/static/', express.static(path.join(__dirname, 'static')));

    // REST API
    expressApp.get("/api/devices/", function (request, response) {

    });

    expressApp.get("/api/devices/:id", function (request, response) {

        var deviceId = request.params.id;
        db.devices.findOne({_id: deviceId}, function (err, device) {
            response.json(device);
        });

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


    // --------------------------------
    // Error Handlers

    function errorHandler(error) {
        if (error) {
            console.log(chalk.bold.red('ERROR'), error);
        }
    }

    process.on('uncaughtException', function (err) {
        // Ignored Purposely (mqtt client disconnection can cause ECONNRESET)
        // so this type of unhandled errors go here instead of crashing the process
    });

    // -----------------------

    // TODO export to different module:

    function onDeviceOccupationUpdate(deviceId, occupied) {

        var now = new Date();

        db.devices.findOne({_id: deviceId}, function (err, device) {

            var shouldNotify = true;
            if (device) {
                shouldNotify = device.occupied != occupied;
            }

            // Persist in database
            db.devices.update(
                {_id: deviceId},
                {
                    $set: {
                        occupied: occupied,
                        lastActive: now
                    }
                },
                {
                    upsert: true
                }, errorHandler);

            if (shouldNotify) {

                // PUB/SUB via web sockets
                var message = {
                    id: deviceId,
                    timestamp: now,
                    occupied: occupied
                };

                // Notify all subscribers
                webSockets.emit('devices:update', message);
            }

        });

    }
})();