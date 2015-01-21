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
    var bodyParser = require('body-parser');
    var path = require("path");
    var expressApp = express();
    var http = require('http').Server(expressApp);
    var webSockets = require('socket.io')(http);
    var mongoClient = require('mongodb').MongoClient;
    var events = require('events');
    var nodemailer = require('nodemailer');
    var smtpTransport = require('nodemailer-smtp-transport');
    var config = require('./config');

    var db = {};

    // --------------------------------
    // SMTP

    var transporter = nodemailer.createTransport(smtpTransport(config.nodemailer));

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
    // Mongo DB Init


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

    // Parse application/json
    expressApp.use(bodyParser.json())

    // Static files
    expressApp.use('/static/', express.static(path.join(__dirname, 'static')));

    // REST API

    expressApp.get("/api/devices/history/", function (request, response) {

        db.devices.find({history: {$exists: true}}, {_id: 1, history: 1,}).toArray(function (err, history) {
            response.json(history);
        });
    });

    expressApp.get("/api/devices/", function (request, response) {
        db.devices.find({}, {_id: 1, occupied: 1, occupiedSince: 1, lastActive: 1}).toArray(function (err, devices) {
            response.json(devices);
        });
    });

    expressApp.get("/api/devices/:id", function (request, response) {

        var deviceId = request.params.id;
        db.devices.findOne({_id: deviceId}, {
            _id: 1,
            occupied: 1,
            occupiedSince: 1,
            lastActive: 1
        }, function (err, device) {
            response.json(device);
        });

    });

    expressApp.get("/api/devices/:id/history", function (request, response) {

        var deviceId = request.params.id;

        db.devices.findOne({_id: deviceId}, {
            _id: 1,
            history: 1
        }, function (err, device) {
            var history = [];
            if (device && device.history) {
                history = device.history;
            }

            response.json(history);
        });
    });

    expressApp.post("/api/devices/:id/subscribe", function (request, response) {

        var deviceId = request.params.id;
        var body = request.body;

        if (!body.email) {
            return response.json({error: 'email must be provided'});
        }

        if (!validateEmail(body.email)) {
            return response.json({error: 'invalid email provided'});
        }

        // Persist in database
        db.devices.update(
            {_id: deviceId},
            {
                $addToSet: {
                    subscribers: body.email
                }
            },
            {},
            function (err, rowsAffected) {
                response.json({success: new Boolean(rowsAffected)});
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

        db.devices.findOne({_id: deviceId},
            function (err, device) {

                var deviceStateChanged = true;

                if (device) {
                    deviceStateChanged = device.occupied != occupied;
                }
                else {
                    device = {
                        occupiedSince: now
                    }
                }

                var update = {
                    occupied: occupied,
                    lastActive: now
                };

                if (occupied) {
                    update.occupiedSince = now;
                }

                // Persist in database
                db.devices.update(
                    {_id: deviceId},
                    {
                        $set: update
                    },
                    {upsert: true},
                    errorHandler);

                if (deviceStateChanged) {

                    // PUB/SUB via web sockets
                    var message = {
                        _id: deviceId,
                        lastActive: now,
                        occupied: occupied,
                        occupiedSince: device.occupiedSince
                    };

                    // Notify all subscribers
                    webSockets.emit('devices:update', message);
                    sendNotificationMail(device);

                    // Save history record

                    if (!occupied) {

                        var duration = now.getTime() - device.occupiedSince.getTime();
                        if (duration) {

                            // Persist in database
                            db.devices.update(
                                {_id: deviceId},
                                {
                                    $addToSet: {
                                        history: {
                                            begin: device.occupiedSince,
                                            end: now,
                                            duration: duration
                                        }
                                    }
                                },
                                {},
                                errorHandler);
                        }

                    }

                }

            });
    }

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    function sendNotificationMail(device) {

        // TODO remove me l8er
        return;

        if (!device.subscribers) {
            return;
        }

        var to = '';
        device.subscribers.forEach(function (subsciber) {
            if (!to) {
                to += ', ';
            }
            to += subsciber;
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'updaterdownloader@gmail.com', // sender address
            to: to, // list of receivers
            subject: device._id + ' is unoccupied', // Subject line
            text: device._id + ' is unoccupied', // plaintext body
            html: '<b>' + device._id + 'is unoccupied ✔</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + info.response);
            }
        });
    }
})();