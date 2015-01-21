(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.factory("SharedService", function ($location, ngAudio, growl) {

        var notification = ngAudio.load('/static/audio/notification.mp3');
        var devices = {};

        return {
            devices: devices,
            playNotificationSound: playNotificationSound,
            showNotification:showNotification,
            go:go
        };

        function playNotificationSound() {
            notification.play();
        }

        function showNotification(message) {
            growl.success(message);
        }

        function go(path) {
            $location.path(path);
        }
    });

})();