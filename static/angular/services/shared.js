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
            showError:showError,
            validateEmail:validateEmail,
            go:go
        };

        function playNotificationSound() {
            notification.play();
        }

        function showNotification(message) {
            growl.success(message);
        }

        function showError(message) {
            growl.error(message);
        }

        function validateEmail(email) {
            if (!email)
            {
                return false;
            }

            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        function go(path) {
            $location.path(path);
        }
    });

})();