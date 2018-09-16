var App = angular.module('CareXchange',['ngResource','ngRoute','ngAnimate','ngStorage','ui.bootstrap','socket.io','ngFileUpload','Controllers'])
.run(["$rootScope", function ($rootScope){
	$rootScope.baseUrl = 'http://localhost:3000'; //Application URL
}]);
App.config(function ($routeProvider, $socketProvider){
	//$socketProvider.setConnectionUrl('/teamchat'); // Socket URL

	$routeProvider	// AngularJS Routes
	.when('/team/:team_id', {
		templateUrl: 'app/views/teamChat.html',
		controller: 'teamChatCtrl',
		resolve: {
			logincheck: checkLoggedin
		}
	})
	.when('/login', {
		redirectTo: function(obj,path,search) {
			window.location.href='/login';
		}
	})
	.otherwise({		
        redirectTo: function(obj,path,search) {
			window.location.href='/login';
		}
    });
});

var checkLoggedin = function($q, $timeout, $http, $location, $rootScope) {
	var deferred = $q.defer();
  
	$http.get('/loggedin').success(function(user) {
	  	$rootScope.errorMessage = null;
	  	//User is Authenticated
	  	if (user !== '0') {
			console.log("USER");
			console.log(user);
			$rootScope.currentUser = user;
			$rootScope.username = user.username;
			$rootScope.userPicture = user.picture;
			$rootScope.loggedIn = true;
			deferred.resolve();
		} else { //User is not Authenticated
			$rootScope.errorMessage = 'You need to log in.';
			deferred.reject();
			$location.url('/login');
		}
		});
	return deferred.promise;
  }
