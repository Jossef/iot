(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("MainController", function ($scope, DeviceService) {
        var vm = $scope;

        vm.pieChartLabels = [];
        vm.pieChartData = [];

        DeviceService.getAllHistory()
            .success(function (devicesHistory) {

            vm.pieChartLabels = [];
            vm.pieChartData = [];

            if (!devicesHistory) {
                return;
            }

            angular.forEach(devicesHistory, function(device){

                var duration = 0;
                angular.forEach(device.history, function(historyItem){
                    duration += historyItem.duration;
                });

                // Converting

                vm.pieChartLabels.push(device._id);
                vm.pieChartData.push(parseInt(duration / 1000 / 60));
            });

        });

        // ------------------
        // Experiments :

        vm.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
        vm.series = ['Series A'];

        vm.data = [
            [65, 59, 80, 81, 56, 55, 40]
        ];


    });

})();