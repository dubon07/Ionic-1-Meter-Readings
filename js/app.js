// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('MeasPoints', ['ionic','ngCordova', 'MeasPoints.controllers', 'MeasPoints.services','ionic.cloud'])

.run(function($ionicPlatform,$state,login,$ionicPopup,$rootScope,$cordovaLocalNotification) {    
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
     
  });
    // listen for push notifications
    $rootScope.$on('cloud:push:notification', function(event, data) {
        var msg = data.message;
        alert(msg.title + ': ' + msg.text);
        /*var alertPopup = $ionicPopup.alert({
                
                title: 'Push! ' + msg.title ,
                template: msg.text
        });*/
        
        $cordovaLocalNotification.schedule({
            id: 1,
            title: msg.title,
            text: msg.text
        }).then(function () {
            console.log('Push notif. delivered');
        },
            function () {
            console.log('Failed to deliver push notif.');
        });
    });
    // logout when app is changed
    $ionicPlatform.on("pause", function(){
        // log off
        console.log("logout? " + login.getLogout() );
        if(login.getLogout() == true){
            $.ajax({
                type: "GET",
                url: "http://[Host IP]:[Port]/sap/public/bc/icf/logoff", //Clear SSO cookies: SAP Provided service to do that 
            }).done(function(data) { //Now clear the authentication header stored in the browser 
                console.log("done logoff");
                //$state.go('app.login');
                $state.go('app.login', {}, { reload: true });
            if (!document.execCommand("ClearAuthenticationCache")) {
                    //"ClearAuthenticationCache" will work only for IE. Below code for other browsers 
                    console.log("if");
                    $.ajax({
                        type: "GET",
                        url: "http://[Host IP]:[Port]/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints", //any URL to a Gateway service 
                        username: 'dummy', //dummy credentials: when request fails, will clear the authentication header 
                        password: 'dummy',
                        statusCode: {
                            401: function() {
                                //This empty handler function will prevent authentication pop-up in chrome/firefox 
                            }
                        },
                        error: function() {
                            //alert('reached error of wrong username password') 
                        }
                    });
                }
            })
        };
        
    });
    
})

.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            //if(event.which === 13) {
                scope.$apply(function (){
                    //console.log('keydown press');
                    scope.$eval(attrs.myEnter);
                });

                //event.preventDefault();
            //}
        });
    };
})


.config(function($stateProvider, $urlRouterProvider, $ionicCloudProvider) {
    
  // Ionic Cloud provider for push notifications    
  $ionicCloudProvider.init({
    "core": {
      "app_id": "dd79b22c"
    },
    "push": {
      "sender_id": "764845574132",
      "pluginConfig": {
        "ios": {
          "badge": true,
          "sound": true
        },
        "android": {
          "iconColor": "#343434"
        }
      }
    }
  });    

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
  
   .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/sidebar.html',
    controller: 'SidebarCtrl'
  })
  
  .state('app.login', {
    url: '/login',
    views: {
      'mainContent': {
        templateUrl: 'templates/login.html',
          controller: 'AppCtrl'
      }
    }
  })
  
  .state('app.search', {
    url: '/search',
    views: {
      'mainContent': {
        templateUrl: 'templates/search.html',
          controller: 'SearchController'
      }
    }
  })
  
  .state('app.create', {
    url: '/createpoint/:id_point/:pttxt/:psort',
    views: {
      'mainContent': {
        templateUrl: 'templates/createpoint.html',
          controller: 'CreateController'
      }
    }
  })
  
  .state('app.favorites', {
    url: '/favorites',
    views: {
      'mainContent': {
        templateUrl: 'templates/favorites.html',
          controller: 'FavoritesController'
      }
    }
  })
  
  .state('app.scanner', {
    url: '/scanner',
    views: {
      'mainContent': {
        templateUrl: 'templates/scanner.html',
          controller: 'ScannerController'
      }
    }
  })
  
  .state('app.user_details', {
    url: '/user_details/:show_menu',
    views: {
      'mainContent': {
        templateUrl: 'templates/user_details.html',
          controller: 'UserDetailsController'
      }
    }
  })
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/login');
  
});
