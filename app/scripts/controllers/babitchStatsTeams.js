'use strict';

babitchFrontendApp.controller("babitchStatsTeamsCtrl", function($scope, $rootScope, babitchStats) {

    $scope.menuSelect = 'teamstats';

    //To deal with ng-repeat scope in stats-player.html views
    $rootScope.setPredicate = function(variable) {
        $rootScope.predicate = variable;
    };
    $rootScope.doReverse = function() {
        $rootScope.reverse = !$rootScope.reverse;
    };
    $rootScope.setStatsVisibleTo = function(variable) {
        $rootScope.statsVisible = variable;
    };

    $scope.stats = babitchStats.getStats();

    $scope.minGamePlayed = 5;

    $scope.getFilteredStat = function(statType) {
        $rootScope.setStatsVisibleTo('statsBars');
         babitchStats.getStatsTeamsFilterBy(statType, $scope.minGamePlayed, false);
    };

});
