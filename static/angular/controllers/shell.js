(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("ShellController", function ($scope, socket, ngAudio) {
            var notification = ngAudio.load('/static/audio/notification.mp3');

            var vm = $scope;
            vm.messages = [];

            socket.on('devices:update', function (message) {
                vm.messages.push({date: new Date(), message: message});
                vm.playSound();

            }).bindTo($scope);

            vm.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
            vm.series = ['Series A'];

            vm.data = [
                [65, 59, 80, 81, 56, 55, 40]
            ];

            vm.playSound = function () {
                notification.play();
            }

        }
    );

})();