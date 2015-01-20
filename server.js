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
    var io = require('socket.io')(http);
    var mongoClient = require('mongodb').MongoClient;

    var devicesCollection;
    var occupiedCache = {};

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

                occupiedCache[mqttClient.id] = data.occupied;
                console.log(chalk.bold.cyan('INCOMING'), mqttClient.id, '->', chalk.cyan(packet.payload));

                devicesCollection.update(
                    { _id: mqttClient.id },
                    {
                        $setOnInsert: {foo: "bar"},
                        $set: {
                            occupied: data.occupied
                        },
                        $push: {
                            activities: {date: new Date(), occupied: data.occupied}
                        }
                    },
                    {
                        upsert: true
                    }, errorHandler);

                var message = {
                    id: mqttClient.id,
                    timestamp: new Date(),
                    occupied: data.occupied
                };

                // Notify all
                io.emit('message', message);
            }
            catch (ex) {
                errorHandler(ex);
            }

        });
    });

    // --------------------------------
    // Mongo DB


    var db = mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(chalk.red(err));
        }
        else {

            console.log(chalk.bold.green('CONNECTED'), 'mongodb', chalk.cyan(mongoDBUrl));

            db.createCollection('devices', errorHandler);

            devicesCollection = db.collection('devices');
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

})();