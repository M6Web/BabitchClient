'use strict';

babitchFrontendApp.controller("babitchCtrl", function ($scope, $http, CONFIG, fayeClient, $timeout) {

    $scope.gameId = null;
    $scope.gameStarted = false;
    $scope.gameEnded = false;
    $scope.playersList = [];
    $scope.focusedSeat = null;
    $scope.focusedSide = null;
    $scope.playerListShawn = false;
    $scope.goalTypeShawn = false;
    $scope.nbPlayers = 0;
    $scope.duration = 0; // seconds

    $scope.goals = [];

    $scope.table = {
        sides: [{
            name: 'red',
            position: 'left',
            score: 0,
            seats: [{
                position: 'attack',
                focused: true,
                player: null
            }, {
                position: 'defense',
                focused: false,
                player: null
            }]
        }, {
            name: 'blue',
            position: 'right',
            score: 0,
            seats: [{
                position: 'attack',
                focused: false,
                player: null
            }, {
                position: 'defense',
                focused: false,
                player: null
            }]
        }]
    };

    $scope.table.sides[0].oppositeSide = $scope.table.sides[1];
    $scope.table.sides[1].oppositeSide = $scope.table.sides[0];


    fayeClient.subscribe(CONFIG.BABITCH_LIVE_FAYE_CHANNEL, function(data) {
        if (data.type == 'requestCurrentGame') {
            notify('currentGame');
        }
    });


    var initGame = function () {
        $scope.gameStarted = false;
        $scope.gameEnded   = false;
        $scope.game        = angular.copy(game);
        $scope.loadPlayers();
    };

    // Timer
    var startTime = null;

    var incrDuration = function () {
        var now = new Date();
        var diff = now-startTime;

        $scope.duration = Math.floor(diff/1000);

        if($scope.gameStarted && !$scope.gameEnded) {
            $timeout(incrDuration, 500);
        }
    }


    $scope.loadPlayers = function () {
        $http({
            url: CONFIG.BABITCH_WS_URL + '/players',
            method: 'GET'
        }).
        success(function(data) {
            $scope.playersList = data;

            // $scope.selectSeat($scope.table.sides[0].seats[0], $scope.table.sides[0]);
            // $scope.choosePlayer($scope.playersList[0]);
            // $scope.selectSeat($scope.table.sides[0].seats[1], $scope.table.sides[0]);
            // $scope.choosePlayer($scope.playersList[1]);
            // $scope.selectSeat($scope.table.sides[1].seats[0], $scope.table.sides[1]);
            // $scope.choosePlayer($scope.playersList[2]);
            // $scope.selectSeat($scope.table.sides[1].seats[1], $scope.table.sides[1]);
            // $scope.choosePlayer($scope.playersList[3]);
            // $scope.startGame();


            // for(var i = 0; i < 9; i++) {
            //     $scope.selectSeat($scope.table.sides[1].seats[1], $scope.table.sides[1]);
            //     $scope.goal();
            // }

        });
    };


    $scope.selectSeat = function (seat, side) {
        $scope.focusedSeat = seat;
        $scope.focusedSeat.focused = true;
        $scope.focusedSide = side;

        if($scope.gameStarted) {
            $scope.goalTypeShawn = true;
        } else {
            $scope.findPlayer();
        }
    };

    $scope.findPlayer = function () {
        $scope.playerListShawn = true;
    }

    $scope.choosePlayer = function (player) {
        if($scope.focusedSeat.player == null) {
            $scope.nbPlayers++;
        }

        $scope.focusedSeat.player = player;
        $scope.focusedSeat.player.alreadySelected = true;
        $scope.resetFocus();
    }

    $scope.resetFocus = function () {
        if($scope.focusedSeat) {
            $scope.focusedSeat.focused = false;
            $scope.focusedSeat = null;
        }

        $scope.focusedSide = null;   
        $scope.playerListShawn = false;
        $scope.goalTypeShawn = false;
    };

    $scope.switchView = function () {
        $scope.table.sides[0].position = ($scope.table.sides[0].position == 'left' ? 'right' : 'left');
        $scope.table.sides[1].position = ($scope.table.sides[1].position == 'left' ? 'right' : 'left');
    }

    $scope.startGame = function () {
        startTime = new Date();

        $scope.gameId = Date.now();
        $scope.gameStarted = true;
        $scope.table.sides[0].score = 0;
        $scope.table.sides[1].score = 0;
        $scope.goals = [];

        notify('start');
    };

    /**
     * Make a goal
     *
     * @return void
     */
    $scope.goal = function () {
        if ($scope.gameStarted && $scope.focusedSeat && $scope.focusedSide) {

            $scope.goals.push({
                position:       $scope.focusedSeat.position,
                player_id:      $scope.focusedSeat.player.id,
                conceder_id:    $scope.focusedSide.oppositeSide.seats[1].player.id,
                autogoal:       false
            });

            $scope.focusedSide.score++;
            $scope.resetFocus();

            notify('goal');
        }
    };

    /**
     * Make an autogoal
     *
     * @return void
     */
    $scope.autogoal = function () {
        if ($scope.gameStarted && $scope.focusedSeat && $scope.focusedSide) {

            $scope.goals.push({
                position:       $scope.focusedSeat.position,
                player_id:      $scope.focusedSeat.player.id,
                conceder_id:    $scope.focusedSide.seats[1].player.id,
                autogoal:       true
            });

            $scope.focusedSide.oppositeSide.score++;
            $scope.resetFocus();

            notify('autogoal');
        }
    };

    /**
     * Switch two players for a side
     * 
     * @param  {Object} side Side with players to switch
     * 
     * @return {void}
     */
    $scope.coach = function (side) {
        var tmp = side.seats[0].player;
        side.seats[0].player = side.seats[1].player;
        side.seats[1].player = tmp;

        notify('coach');
    };

    /**
     * Cancel last goal
     * 
     * @return {void}
     */
    $scope.cancelGoal = function () {
        var lastGoal = $scope.goals.pop();

        // For each side's table
        $scope.table.sides.forEach(function (side) {

            // For each seat's
            side.seats.forEach(function (seat) {

                if(seat.player.id != lastGoal.player_id) {
                    return;
                }

                if(lastGoal.autogoal) {
                    side.oppositeSide.score--;
                } else {
                    side.score--;
                }
            });
        });

        notify('cancel');
    };

    /**
     * Cancel game
     * 
     * @return {void}
     */
    $scope.cancelGame = function () {
        $scope.gameStarted = false;
    };

    /**
     * Send an event notification to faye channel
     * 
     * @param  {string} eventName Event's name
     * 
     * @return {void}
     */
    var notify = function (eventName) {
        if ($scope.gameStarted) {
            fayeClient.publish(CONFIG.BABITCH_LIVE_FAYE_CHANNEL, {
                type:       eventName,
                gameId:     $scope.gameId,
                // game:       $scope.game,
                // players:    $scope.game.player[0]
            });
        }
    };



    $scope.$watch('gameStarted', function(started) {
        if(started) {
            incrDuration();
        }
    });

    $scope.$watch('gameEnded', function(ended) {
        if(!ended && $scope.gameStarted) {
            incrDuration();
        }
    });

    $scope.$watch('table.sides[0].score', function (score) {
        if (score == 10) {
            $scope.gameEnded = true;
            //$scope.saveGame();
            console.log('end');
        }
     });

    $scope.$watch('table.sides[1].score', function (score) {
        if (score == 10) {
            $scope.gameEnded = true;
            //$scope.saveGame();
            console.log('end');
        }
     });


    initGame();

    window.$scope = $scope;
    return;










    // Model Game object ready to be sent to the API
    var game = {
        red_score: 0,
        blue_score: 0,
        player: [
            { team: 'red', position: 'defense' },
            { team: 'blue', position: 'attack' },
            { team: 'red', position: 'attack' },
            { team: 'blue', position: 'defense' },
        ],
        goals: []
    };


    $scope.saveGame = function () {
        notify('end');
        $scope.gameStarted = false;
        $http({
            url: CONFIG.BABITCH_WS_URL + '/games',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: $scope.game
        }).
        success(function(data, status) {
            $scope.initGame();
        }).
        error(function (data, status) {
            if (status == 0) {
                setTimeout(function () {$scope.saveGame();}, 1000);
            }
        });
    };
})
.filter('prettyTime', function() {
    return function(time) {
        var minutes = Math.floor(time/60);
        var seconds = time%60;

        minutes = (minutes < 10 ? '0'+minutes : minutes);
        seconds = (seconds < 10 ? '0'+seconds : seconds);

        return minutes+' : '+seconds;
    }
});
