(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("ShellController", function ($scope, socket) {
            $scope.messages = [];

            socket.on('message', function (message) {
                $scope.messages.push({date: new Date(), message: message});
            }).bindTo($scope);


            $scope.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
            $scope.series = ['Series A'];

            $scope.data = [
                [65, 59, 80, 81, 56, 55, 40]
            ];

        }
    );

})();