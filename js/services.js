angular.module('MeasPoints.services', [])


// Login factory
.factory('login', [ '$q', '$http','$localStorage', function($q, $http, $localStorage,$ionicLoading){
    
    var loginFact = {};
    
    // store user for later - internal use
    loginFact.storeUser = function(user){ 
        loginFact.user = user;
    };
    
    // get user for internal use
    loginFact.getUser = function(){
        return loginFact.user;
    };
    
    // store logindata in local storage device
    loginFact.storeLoginData = function(logindata , firstTime){
        // store login on device
        console.log("store logindata: ");
        console.log(logindata);
        console.log("firstTime: " + firstTime);
        // create initial object {} in device
        if( firstTime == true){
            $localStorage.storeObject('logindata', logindata);
        };
        if( logindata.rememberme == true ){
            $localStorage.storeObject('logindata', logindata);
        }else{
            $localStorage.storeObject('logindata', {});
        };
    };
    
    // get logindata from local storage device
    loginFact.getLoginData = function(){
        var loginData = $localStorage.get('logindata', []);
        console.log("get logindata: ");
        console.log(loginData);
        if( Array.isArray(loginData) == false ){
            console.log("is not array");
            loginFact.loginData = $localStorage.getObject('logindata', []);
        }else{
            console.log("is array");
            loginFact.loginData = {};
        };
        return loginFact.loginData;
    }; 
    
    // store boolean - logout needs to be done?
    loginFact.storeLogout = function(val){
        loginFact.logout = val ;
    };
    
    // get boolean - logout needs to be done?
    loginFact.getLogout = function(){
        return loginFact.logout;
    };
    
    // return login factory object
    return loginFact;
    
}])

// User Details factory
.factory('userDetailFactory',[ '$http','$ionicLoading', function($http,$ionicLoading){
    // Init. factory object
    var userDetailFact = {};
    
    // get user details from server
    userDetailFact.getUserDetails = function(url){
        console.log(url);
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        userDetailFact.userDetailPromise = $http({
            method: 'GET',
            url: url,
            headers:{
                //"Authorization" : auth ,
                "Access-Control-Allow-Credentials" : "true" ,
                "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
            }
        }).then(function(response){
            console.log("response:");
            console.log(response);
            console.log(response.data.d);
            $ionicLoading.hide();
            return response.data.d;
        },function(e){
            console.log('Error: ' + e.status + ' ' + e.statusText);
            $ionicLoading.hide();
            return {};
        });
        
        return userDetailFact.userDetailPromise;
    };
    
    // store user details temporarily
    userDetailFact.storeUserDetails = function(userDetails){
        userDetailFact.userDetails = userDetails;
    };
    
    // load user details
    userDetailFact.loadUserDetails = function(){
        return userDetailFact.userDetails;
    };
    
    // Return factory object
    return userDetailFact;
}])

// Measuring Points Factory
.factory('measPointFactory', [ '$http','$ionicLoading', function($http,$ionicLoading){
    var measPointFact = {};
    
    // get meas. points from server
    measPointFact.getPoints = function(url){
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        measPointFact.measPointsPromise = $http({
                method: 'GET',
                url: url,
                headers:{
                    //"Authorization" : auth ,
                    "Access-Control-Allow-Credentials" : "true" ,
                    "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
                }
            }).then(function(response){
            //alert("Search Controller Init!");
            //$scope.measpoints = response.data.d.results;
            $ionicLoading.hide();
            return response.data.d.results;
            //console.log(favFac.measPoints);
            //return favFac.measPoints;
        },function(e){
            console.log('Error: ' + e.status + ' ' + e.statusText);
            $ionicLoading.hide();
            return {};
        });
        
        return measPointFact.measPointsPromise;
        
    };
    
    //return measPointFactory object
    return measPointFact;
}])

.factory('createFactory', [ '$http', function($http){
    var createFact = {};
    
    createFact.setLastVal = function(lastVal){
        createFact.lastVal = lastVal;  
    };
    
    createFact.getLastVal = function(){
        return createFact.lastVal;
    };
    
    createFact.setError = function(value){
        createFact.error = value;
    };
    
    createFact.getError = function(){
        return createFact.error;
    };
    
    
    return createFact;
}])

.factory('$localStorage', ['$window', function($window) {
  return {
    store: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    storeObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key,defaultValue) {
      return JSON.parse($window.localStorage[key] || defaultValue);
    }
  }
}])

.factory('favoriteFactory', ['$localStorage','basicAuth','$http','$ionicPlatform','$cordovaLocalNotification','$cordovaToast','$ionicLoading','$ionicPopup','$state', function($localStorage,basicAuth,$http,$ionicPlatform,$cordovaLocalNotification,$cordovaToast,$ionicLoading,$ionicPopup,$state){
    var favFac = {};
    var favorites = [];
    
    favFac.addToFavorites = function(point, user){
        // store on device
        /*for (var i = 0; i < favorites.length; i++){
            if (favorites[i].point == point)
                return;
        }
        favorites.push({point: point});
        $localStorage.storeObject('favorites_' + user, favorites);*/
        
        
        // store on server
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        var url = "http://[Host IP]:[Port]/sap/opu/odata/sap/ZMPOINT4_SRV/FavPointSet";
        //create Fav JSON
        var favPoint = {
                        "d" : {
                            "__metadata" : {
                                "id" : url,
                                "uri" : url,
                                "type" : "ZMPOINT4_SRV.FavPoint"
                            },
                            "User": user,
                            "Point": point,
                            "Psort": "",
                            "Pttxt": ""
                        }
        };
        
        
        // get X-CSRF-Token
        var header_xcsrf_token = basicAuth.getXCSRF_Token(); 
        
        // Send POST request
        console.log('user:'+user);
        console.log('point:'+point);
        console.log(favPoint);
        $http({
            method: 'POST',
            url: url,
            data: favPoint,
            headers:{
                "X-Requested-With": "XMLHttpRequest", 
                //"Authorization" : auth ,
                "X-CSRF-Token" : header_xcsrf_token,
                //"Access-Control-Allow-Credentials" : "true" ,
                "DataServiceVersion": "2.0",   
                "Accept": "application/atom+xml,application/atomsvc+xml,application/xml,application/json", 
                "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
            },
            dataType: "json",
            contentType: 'application/json'
        }).then(function(response){
            $ionicLoading.hide();
            $ionicPlatform.ready(function () {
                $cordovaLocalNotification.schedule({
                    id: 1,
                    title: "Added Favorite",
                    text: 'Point: ' + point
                }).then(function () {
                    console.log('Added Favorite '+ point);
                },
                function () {
                    console.log('Failed to add Notification ');
                });

                $cordovaToast
                  .show('Added Favorite Point '+ point, 'long', 'center')
                  .then(function (success) {
                      // success
                  }, function (error) {
                      // error
                  });
            });
            console.log(response);
        }, function(e){
            $ionicLoading.hide();
            alert("error adding favorite");
            console.log(e);
        });
        
    };
        
    
    favFac.deleteFromFavorites = function(point, user, measpoints, index) {
        // delete from device
        /*for (var i = 0; i < favorites.length; i++){
            if (favorites[i].point == point){
                favorites.splice(i, 1);
                $localStorage.storeObject('favorites_' + user, favorites);
            }
        }*/
        
        // delete from server
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        var url = "http://[Host IP]:[Port]/sap/opu/odata/sap/ZMPOINT4_SRV/FavPointSet(User='"+ user +"',Point='"+ point +"')";
        //create Fav JSON
        var favPoint = {
                        "d" : {
                            "__metadata" : {
                                "id" : url,
                                "uri" : url,
                                "type" : "ZMPOINT4_SRV.FavPoint"
                            },
                            "User": user,
                            "Point": point,
                            "Psort": "",
                            "Pttxt": ""
                        }
        };
        
        
        // get X-CSRF-Token
        var header_xcsrf_token = basicAuth.getXCSRF_Token(); 
        
        // Send DELETE request
        console.log('user:'+user);
        console.log('point:'+point);
        console.log(favPoint);
        $http({
            method: 'DELETE',
            url: url,
            data: favPoint,
            headers:{
                "X-Requested-With": "XMLHttpRequest", 
                //"Authorization" : auth ,
                "X-CSRF-Token" : header_xcsrf_token,
                //"Access-Control-Allow-Credentials" : "true" ,
                "DataServiceVersion": "2.0",   
                "Accept": "application/atom+xml,application/atomsvc+xml,application/xml,application/json", 
                "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
            },
            dataType: "json",
            contentType: 'application/json'
        }).then(function(response){
            $ionicLoading.hide();
            var msg = "Favorite point: "+ point +" removed.";
            var alertPopup = $ionicPopup.alert({
                title: 'Success',
                template: msg
            });
            measpoints.splice(index, 1);
            console.log(response);
            
        }, function(e){
            $ionicLoading.hide();
            var msg = 'Favorite not deleted, try again.';
            var alertPopup = $ionicPopup.alert({
                title: 'Error',
                template: msg
            });
            console.log(e);
        });
        
    };
    
    favFac.getFavorites = function(user){
        // get from local device
        /*favorites = $localStorage.getObject('favorites_' + user, []);
        return favorites;*/
        
        // get from server
        //var auth = basicAuth.getMytoken();
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        var url = "http://[Host IP]:[Port]/sap/opu/odata/sap/ZMPOINT4_SRV/FavPointSet?$format=json";
        //favFac.measPoints = undefined;
        favFac.measPointsPromise = $http({
                method: 'GET',
                url: url,
                headers:{
                    //"Authorization" : auth ,
                    "Access-Control-Allow-Credentials" : "true" ,
                    "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
                }
            }).then(function(response){
            //alert("Search Controller Init!");
            //$scope.measpoints = response.data.d.results;
            $ionicLoading.hide();
            return response.data.d.results;
            //console.log(favFac.measPoints);
            //return favFac.measPoints;
        },function(e){
            console.log('Error: ' + e.status + ' ' + e.statusText);
            $ionicLoading.hide();
            return {};
        });
        
        return favFac.measPointsPromise;
    };
    
    favFac.storeMeasPoints = function(measpoints){
        favFac.measPoints = measpoints;
    };
    
    favFac.getMeasPoints = function(){
        return favFac.measPoints;  
    };
    
    return favFac;
}])


.factory('basicAuth', function() {
    var authFact = {};
    
    authFact.setXCSRF_Token = function(xcsrf_token){
        authFact.xcsrf_token = xcsrf_token;
    };
    
    authFact.getXCSRF_Token = function(){
        return authFact.xcsrf_token;
    };
    
    authFact.makeBasicAuth = function(uname, pword){
        var Base64 = {
            // private property
            _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
            // public method for encoding
            encode : function (input) {
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;
 
                input = Base64._utf8_encode(input);
 
                while (i < input.length) {
 
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);
 
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
 
                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
 
                    output = output +
                        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
                }
 
                return output;
            },
 
            // public method for decoding
            decode : function (input) {
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
 
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
                while (i < input.length) {
 
                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));
 
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
 
                    output = output + String.fromCharCode(chr1);
 
                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }
                }
 
                output = Base64._utf8_decode(output);
 
                return output;
 
            },
 
            // private method for UTF-8 encoding
            _utf8_encode : function (string) {
                string = string.replace(/\r\n/g,"\n");
                var utftext = "";
 
                for (var n = 0; n < string.length; n++) {
 
                    var c = string.charCodeAt(n);
 
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
 
                }
 
                return utftext;
            },
 
            // private method for UTF-8 decoding
            _utf8_decode : function (utftext) {
                var string = "";
                var i = 0;
                var c = c1 = c2 = 0;
 
                while ( i < utftext.length ) {
 
                    c = utftext.charCodeAt(i);
 
                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i+1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else {
                        c2 = utftext.charCodeAt(i+1);
                        c3 = utftext.charCodeAt(i+2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }
 
                }
 
                return string;
            }
 
        }
        
        var tok = uname + ':' + pword;
        var hash = Base64.encode(tok);
        authFact.mytoken = "Basic " + hash;
        return authFact.mytoken;
    };
    
    authFact.getMytoken = function(){
        return authFact.mytoken;
    };
    
    return authFact;
    
});
