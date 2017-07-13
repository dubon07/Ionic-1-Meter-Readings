angular.module('MeasPoints.controllers', [])

// sidebar controller
.controller('SidebarCtrl', ['$scope', '$state','userDetailFactory',function($scope, $state, userDetailFactory){
    //navigate to favorites
    $scope.goToFavorites = function(){
         $state.go('app.favorites');
    };
    
    $scope.goToSearch = function(){
        $state.go('app.search');
    };
    
    $scope.showScanner = function(){
        $state.go('app.scanner');
    };
    
    $scope.showUserDetails = function(){
        // go to user detail screen
        $state.go('app.user_details', { show_menu: true });  
    };
    
    $scope.logout = function(){
        $.ajax({
            type: "GET",
            url: "http://110.174.118.24:8001/sap/public/bc/icf/logoff", //Clear SSO cookies: SAP Provided service to do that 
        }).done(function(data) { //Now clear the authentication header stored in the browser 
            console.log("logout");
            $state.go('app.login');
            if (!document.execCommand("ClearAuthenticationCache")) {
                //"ClearAuthenticationCache" will work only for IE. Below code for other browsers 
                //console.log("if");
                $.ajax({
                    type: "GET",
                    url: "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints", //any URL to a Gateway service 
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
    
}])

// login controller
.controller('AppCtrl', ['$scope', '$state', 'basicAuth', 'login', '$http', '$ionicPopup','$ionicLoading','$ionicPush','userDetailFactory','$ionicSideMenuDelegate', function($scope, $state, basicAuth, login, $http, $ionicPopup,$ionicLoading,$ionicPush,userDetailFactory,$ionicSideMenuDelegate) {
    
    
    //$scope.$on('$ionicView.leave', function () { $ionicSideMenuDelegate.canDragContent(true) });
    
    // Get last stored login data (if any)
    $scope.$on('$ionicView.enter', function () {  
    
        //disable drag side menu
        $ionicSideMenuDelegate.canDragContent(false);
        $scope.loginData = {} ;
        var lastloginData = login.getLoginData();
    
        // is there is no previous data, create initial data
        if( angular.equals({},lastloginData) == true ){
            login.storeLoginData($scope.loginData, true);
        }else{
            if( lastloginData.rememberme == true ){
                $scope.loginData = lastloginData ;    
            }else{
                $scope.loginData = {} ;
            };
        
        };
    });
    
    
    // Perform the login action when the user submits the login form
    $scope.doLogin2 = function(){
        // show loading screen
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        
        // create basic auth for SAP with user and pwd
        var auth = basicAuth.makeBasicAuth($scope.loginData.user, $scope.loginData.pwd);
        // GW URL used for login
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/UserDetailSet(Username='" + $scope.loginData.user + "')?$format=json";
        // execute http GET request
        OData.request
        ({
            requestUri: url,
            method: "GET",
            headers:{
                "Authorization" : auth ,
                "Access-Control-Allow-Credentials" : "true" ,
                "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS",
                "X-Requested-With": "XMLHttpRequest",  
                "Content-Type": "application/atom+xml",  
                "DataServiceVersion": "2.0",           
                "X-CSRF-Token":"Fetch"
            }
        },
         function(data, response){
            // get X-CSRF token and store it in factory
            header_xcsrf_token = response.headers['x-csrf-token'];
            basicAuth.setXCSRF_Token(header_xcsrf_token);

            // store user in factory
            login.storeUser($scope.loginData.user);
            
            // store login data in local storage if "remember me" is checked
            login.storeLoginData($scope.loginData, false);
            if( $scope.loginData.rememberme == true){
                login.storeLogout(false);
            }else{
                login.storeLogout(true);
            };
            
            // Register for Push notifications with Ionic Cloud push
            $ionicPush.register().then(function(t) {
                return $ionicPush.saveToken(t,true);
            }).then(function(t) {
                console.log('Token saved:', t.token);
            });
            
            // clear login data
            $scope.loginData = {};
            
            // check if user details have been completed, if not, load user detail screen
            console.log(data.Mplant);
            if( data.Mplant == 'n/a'){ // no record found in /ZPM/user_detail SAP table
                // go to user detail screen
                $ionicLoading.hide();
                $state.go('app.user_details', { show_menu: false }); 
            }else{
                // hide loading screen and go to search screen
                $ionicLoading.hide();
                $state.go('app.search'); 
            };
        },
         function (err){
            var request = err.request; // the request that was sent.  
            var response = err.response; // the response that was received.  
            
            console.log(err);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                
                title: 'Invalid Login!',
                template: "Check Username and Password"
            });

            alertPopup.then(function(res) {
                console.log('Unauthorized Access');
            });
        });
    };
    
    
}])


// Search.html controller
.controller('SearchController', ['$scope', '$http', 'basicAuth', '$state','$ionicListDelegate','favoriteFactory','login','$ionicPlatform','$cordovaLocalNotification','$cordovaToast','$ionicLoading','measPointFactory','$ionicModal','userDetailFactory','$ionicSideMenuDelegate',function($scope, $http, basicAuth, $state,  $ionicListDelegate, favoriteFactory, login,$ionicPlatform,$cordovaLocalNotification,$cordovaToast, $ionicLoading,measPointFactory,$ionicModal,userDetailFactory,$ionicSideMenuDelegate) {
    // Initialize JSON objects
    $scope.search = {}; 
    //enable side menu drag
    $scope.$on('$ionicView.leave', function () { $ionicSideMenuDelegate.canDragContent(true) });
    
    // Live Search 
    $scope.doLiveSearch = function(){
        console.log($scope.search.val);
        var val = $scope.search.val;
        var len = val.length;
        console.log(val + len);
        if(len > 0){
            console.log($scope.search.val);
            console.log(isNaN($scope.search.val));
            if(isNaN($scope.search.val) == true){ //not a number
                var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints?$filter=substring(Pttxt, 0, " + len +") eq '" + val + "'";    
            }else{ //it is a number
                var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints?$filter=substring(Point, 0, " + len +") eq '" + val + "'";
            };
            
            console.log(url);
            measPointFactory.getPoints(url).then(function(data){
                $scope.measpoints = data; 
            },function(err){
                console.log(err);
                $scope.measpoints = {} ;
            });
        };
    };
    
    
    function getMeasPoints(){
        // retrieve meas points from server
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        var auth = basicAuth.getMytoken();
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints?$format=json";
        $http({
                method: 'GET',
                url: url,
                headers:{
                    "Authorization" : auth ,
                    "Access-Control-Allow-Credentials" : "true" ,
                    "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS"
                }
            }).then(function(response){
            //alert("Search Controller Init!");
            $scope.measpoints = response.data.d.results;
            $ionicLoading.hide();
            favoriteFactory.storeMeasPoints($scope.measpoints);
        },function(e){
            console.log('Error: ' + e.status + ' ' + e.statusText);
            $ionicLoading.hide();
        });
    }; 
    
    // navigate to create screen
    $scope.goToCreateScreen = function(point,pttxt,psort){
        $state.go('app.create', { id_point: point,
                                  pttxt: pttxt,
                                  psort: psort
                                }); 
    };
    
    // add to favorites
    $scope.addFavorite = function(point){
        var user = login.getUser();
        console.log("point:" + point);
        favoriteFactory.addToFavorites(point,user);
        $ionicListDelegate.closeOptionButtons();
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
    };
    
}])

// createpoint.html controller
.controller('CreateController', ['$scope','$stateParams', '$http', 'basicAuth','$ionicPopup','$ionicNavBarDelegate','login','favoriteFactory','$ionicPlatform','$cordovaLocalNotification','$cordovaToast','createFactory','$ionicLoading', function($scope, $stateParams,$http, basicAuth, $ionicPopup,$ionicNavBarDelegate,login,favoriteFactory,$ionicPlatform,$cordovaLocalNotification,$cordovaToast,createFactory,$ionicLoading) {
    $scope.point = {};
    $scope.doc = {};
    $scope.point.point = $stateParams.id_point;
    $scope.point.pttxt = $stateParams.pttxt;
    $scope.point.psort = $stateParams.psort;
    //login.storeLogout(true);
    
    //show back button always (used for bug in ios)
    $ionicNavBarDelegate.showBackButton(true);
    
    // load last meas. doc values
    loadLastValues($stateParams.id_point);
    
    // set current date and time
    setCurrentDateTime();
    
    /* functions */
    // Set current date and time
    function setCurrentDateTime(){
        /*var today = new Date().toLocaleDateString();
        $scope.doc.idate2 = new Date(today);*/
        // date
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
            dd='0'+dd
        } 

        if(mm<10) {
            mm='0'+mm
        } 

        today = mm+'/'+dd+'/'+yyyy;
        $scope.doc.idate2 = new Date(today);
    
        // time
        var now     = new Date(); 
        var hour    = now.getHours();
        var minute  = now.getMinutes();
        var second  = now.getSeconds();
        var time =  new Date(00,0,00,hour,minute,second,0); 
        $scope.doc.itime2 = time;
    };
    
    // get, load(on screen) and store last measurement doc. values
    function loadLastValues(point){
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading...'
        });
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasDocSet(Point='" + point + "')?$format=json";
         $http({
                method: 'GET',
                url: url,
                headers:{
                    //"Authorization" : auth ,
                    "Access-Control-Allow-Credentials" : "true" ,
                    "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS",
                    //"X-Requested-With": "XMLHttpRequest",
                    //"Content-Type": 'application/json',
                    //"DataServiceVersion": "2.0",       
                    //"X-CSRF-Token": "fetch" 
                }
            }).then(function(response){
            // store meas. doc values 
            var measdoc = response.data;
            console.log('measdoc:');
            console.log(measdoc); 
            // assign last value number
            var dec = new Number(measdoc.d.Readg);
            $scope.doc.readg = dec;
            $scope.doc.woob1 = measdoc.d.Woob1; 
            // parse date for display 
            console.log(measdoc.d.Idate);
            console.log(measdoc.d.Idate.substring(6,19)); 
            var date = new Date(parseInt(measdoc.d.Idate.substring(6,19))); 
            console.log('date:'); 
            console.log(date);
            var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;  
            console.log('offset: ' + TZOffsetMs);  
            var date2 = new Date(date.getTime() + TZOffsetMs);
            console.log('date w/ offset:');
            console.log(date2); 
            //var date2 = new Date(date.toUTCString());
            //console.log('dat2: ' + date2); 
            
            
            var dd = date2.getDate();
            console.log('day: ' + dd);
            var mm = date2.getMonth()+1; //January is 0!
            var yyyy = date2.getFullYear();

            if(dd<10) {
                dd='0'+dd
            } 

            if(mm<10) {
                mm='0'+mm
            } 

            date2 = mm+'/'+dd+'/'+yyyy;
            console.log(date2); 
            $scope.doc.idate = new Date(date2); 
             
             
            /*var date = new Date(parseInt(measdoc.d.Idate.substr(6))).toUTCString(); 
            console.log(date);
            $scope.doc.idate = date.substring(0,16);*/
            // parse time for display 
            var time = measdoc.d.Itime;
            var hour = time.substring(2,4);
            var min =  time.substring(5,7); 
            var sec =  time.substring(8,10);  
            var t = new Date(00,0,00,hour,min,sec,0); 
            $scope.doc.itime = t; 
            // Assign last text
            $scope.doc.mdtxt = measdoc.d.Mdtxt; 
            // Assign last meas doc
            $scope.doc.mdocm = measdoc.d.Mdocm;
            //console.log('inside loadlastvalues');
            //console.log(measdoc); 
            //createFactory.setLastVal(measdoc);
            //createFactory.setError(false);
            $ionicLoading.hide();
         }, function(e){
            console.log('error getting last values'); 
            //createFactory.setError(true);
            //getLastValues('1200000');
            $ionicLoading.hide(); 
         });
        
    };
    
    // get and store last measurement doc. values from server of a given point
    function getLastValues(point){
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasDocSet(Point='" + point + "')?$format=json";
         $http({
                method: 'GET',
                url: url,
                headers:{
                    //"Authorization" : auth ,
                    "Access-Control-Allow-Credentials" : "true" ,
                    "Access-Control-Allow-Method" : "GET,PUT,POST,DELETE,OPTIONS",
                    //"X-Requested-With": "XMLHttpRequest",
                    //"Content-Type": 'application/json',
                    //"DataServiceVersion": "2.0",       
                    //"X-CSRF-Token": "fetch" 
                }
            }).then(function(response){
            // store meas. doc values 
            var measdoc = response.data;
            //console.log('measdoc:');
            //console.log(measdoc);  
            createFactory.setLastVal(measdoc); 
         }, function(e){
            console.log('error getting last values'); 
         });
        
    };
    
    // add to favorites
    $scope.addFavorite = function(point){
        var user = login.getUser();
        favoriteFactory.addToFavorites(point,user);
    };
    
    function createMeasdocJSON(url,mdocm,woob1,point,idate,itime,mdtxt,readg){
        var measdocJSON = {
                        "d" : {
                            "__metadata" : {
                                "id" : url,
                                "uri" : url,
                                "type" : "ZMPOINT4_SRV.MeasDoc"
                            },
                            "Mdocm" : mdocm,
                            "Woob1" : woob1,
                            "Point" : point,
                            "Idate" : idate,
                            "Itime" : itime,
                            "Mdtxt" : mdtxt,
                            "Readg" : readg
                        }
        };
        //var measdocJSON = JSON.parse(measdocString);
        //console.log("measdocJSONin:");
        //console.log(measdocJSON);
        return measdocJSON;
    };
    
    // create meas. doc
    $scope.createMeasDoc = function(){
        //console.log("creating measdoc..");
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasDocSet";
        
        // get X-CSRF-Token
        header_xcsrf_token = basicAuth.getXCSRF_Token(); 
        
        // Convert date to EDM string type
        var milsec = Date.parse($scope.doc.idate2);
        console.log(milsec);
        var date = "/Date(" + milsec + ")/";
        
        // Convert time to EDM string type
        var hour = $scope.doc.itime2.getHours();
        var min = $scope.doc.itime2.getMinutes();
        var sec = $scope.doc.itime2.getSeconds();
        if(hour < 10){
            hour = "0" + hour;
        };   
        if(min < 10) {
            min = "0" + min;
        };
        if(sec < 10){
            sec = "0" + sec;
        };
        var time = "PT" + hour + "H" + min + "M" + sec + "S";
        
        // create JSON for POST
        var measdoc = createMeasdocJSON(url,$scope.doc.mdocm,$scope.doc.woob1,$scope.point.point,date,time,$scope.doc.mdtxt2,$scope.doc.readg2);
        console.log("create measdoc:");
        console.log(measdoc);
        // POST to server
        $http({
                method: 'POST',
                url: url,
                data: measdoc,
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
            //alert("Search Controller Init!");
                //console.log(response);
                //$scope.doc.mdocm = response.config.data.d.Mdocm;
                //alert("created!");
                //var msg = 'Meas. Doc. #: ' + $scope.doc.mdocm + ' created!';
                var msg = 'New Measurement Doc. Created!';
                var alertPopup = $ionicPopup.alert({
                    title: 'Success',
                    template: msg
                });
                alertPopup.then(function(res) {
                    console.log('Ok');
                    // clean fields
                    $scope.doc = {};
                    //$scope.doc.mdocm = response.config.data.d.Mdocm;
                    // load last meas. doc values
                    loadLastValues($stateParams.id_point);
                    // set current date and time
                    setCurrentDateTime();
                });
                
            
            },function(e){
                $scope.doc.mdocm = 'Error';
                //alert("error!: " + e.response);
                console.log(e);
                // parse xml error 
                console.log(e.data);
                if (window.DOMParser)
                {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(e.data, "text/xml");
                }
                else // Internet Explorer
                {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(e.data);
                }
                console.log(xmlDoc.getElementsByTagName("message"));
                if(xmlDoc.getElementsByTagName("message").length >= 2){
                    var msg = xmlDoc.getElementsByTagName("message")[1].childNodes[0].nodeValue;
                }else{
                    var msg = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                };
                
                //var msg = 'Error: ' + e.statusText;
                console.log(msg);
                var alertPopup = $ionicPopup.alert({
                    title: 'Error!',
                    template: msg
                });
                alertPopup.then(function(res) {
                    console.log('NOK');
                });
            });
    };
}])

//Scanner controller
.controller('ScannerController', ['$scope', '$state','$cordovaBarcodeScanner','$ionicPopup','measPointFactory','login', function($scope,$state,$cordovaBarcodeScanner,$ionicPopup,measPointFactory,login){
    //$scope.scan = function(){
    //    alert('scan!');
    //};
    $scope.scan = function(){
        login.storeLogout(false);
        var options = {
                        "preferFrontCamera" : true, // iOS and Android 
                        "showFlipCameraButton" : true, // iOS and Android 
                        "prompt" : "Place a barcode inside the scan area", // supported on Android only 
                        "formats" : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED 
                        "orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device 
                      }
        $cordovaBarcodeScanner.scan(options).then(function(imageData){
                // search related meas docs using meas pos
                loadMeasDoc(imageData.text);
                // navigate to create screen
            
        }, function(error){
                var alertPopup = $ionicPopup.alert({
                    title: 'Failed',
                    template: 'Error: ' + error
                });
                alertPopup.then(function(res) {
                    console.log('error scan');
                });
            
        });
    };
    
    // Search
    function loadMeasDoc(val){
        console.log(val);
        var len = val.length;
        console.log(val + len);
        if(len > 0){
            //console.log($scope.search.val);
            //console.log(isNaN($scope.search.val));
            var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/MeasPoints?$filter=substring(Pttxt, 0, " + len +") eq '" + val + "'";    
            //console.log(url);
            measPointFactory.getPoints(url).then(function(data){
                //console.log("meas pos doc:");
                //console.log(data);
                if(data.length > 0){
                    $state.go('app.create', { id_point: data[0].Point,
                                  pttxt: data[0].Pttxt,
                                  psort: data[0].Psort
                    });
                }else{
                    var alertPopup = $ionicPopup.alert({
                        title: 'Failed',
                        template: 'Error. Point not found.'
                    });
                    alertPopup.then(function(res) {
                        console.log('Meas point not found');
                    });
                };
                 
                //return data; 
            },function(err){
                console.log(err);
                //return {} ;
            });
        };
    };
}])

// User Detail Screen Controller
.controller('UserDetailsController', [ '$scope', '$state', '$http', '$ionicPopup','$stateParams','basicAuth','userDetailFactory','login','$ionicSideMenuDelegate',function($scope, $state,$http,$ionicPopup,$stateParams,basicAuth,userDetailFactory,login,$ionicSideMenuDelegate){
    //Initialize scope data
    $scope.user = {};
    $scope.menu = {};
    
    //disable drag side menu
    //$scope.$on('$ionicView.enter', function () { $ionicSideMenuDelegate.canDragContent(false) });
    //enable drag side menu on view exit
    $scope.$on('$ionicView.leave', function () { $ionicSideMenuDelegate.canDragContent(true) });
    
    // check if show side menu or not
   // $scope.$on('$ionicView.enter', function () { 
    console.log('stateParams.show_menu:');
    console.log($stateParams.show_menu);
    console.log('scope.hide:(bef)' );
    console.log($scope.menu.hide);
    if( $stateParams.show_menu == 'true' ){
        $scope.menu.hide = false;
    };
    if( $stateParams.show_menu == 'false' ){
        $scope.menu.hide = true;
        
    };
    console.log('scope.hide: ' + $scope.menu.hide );
    
    
   // });
    
    //get default user details
    var user = login.getUser();
    var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/UserDetailSet(Username='" + user + "')?$format=json";
    userDetailFactory.getUserDetails(url).then(function(data){ 
        console.log("data:");
        console.log(data);
        $scope.user.Username = data.Username;
        $scope.user.Fullname = data.Fullname;
        $scope.user.Pernr = parseInt(data.Pernr);
        if( data.Mplant == 'n/a'){
            $scope.user.Mplant = '';
        }else{
            $scope.user.Mplant = data.Mplant; 
        };
        
        $scope.user.Wcentre = data.Wcentre;
        console.log('$scope:');
        console.log($scope.user.Username);console.log($scope.user.Fullname);console.log($scope.user.Pernr);  
    }, function(err){
        console.log(err);
    });   
    
    // create JSON object to POST user details
    function createUserDetailJSON(url,user,name,pnum,mplant,wcentre){
        var pernr = pnum.toString();
        var userdetailJSON = {
                        "d" : {
                            "__metadata" : {
                                "id" : url,
                                "uri" : url,
                                "type" : "ZMPOINT4_SRV.UserDetail"
                            },
                            "Username" : user,
                            "Fullname" : name,
                            "Pernr" : pernr,
                            "Mplant" : mplant,
                            "Wcentre" : wcentre,
                        }
        };
        //var measdocJSON = JSON.parse(measdocString);
        //console.log("measdocJSONin:");
        //console.log(measdocJSON);
        return userdetailJSON;
    };

    // Save user details on server
    $scope.saveUserDetails = function(){
        //console.log("creating measdoc..");
        var url = "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/UserDetailSet";
        
        // get X-CSRF-Token
        header_xcsrf_token = basicAuth.getXCSRF_Token(); 
        
        // create JSON for POST
        var userdetail = createUserDetailJSON(url,$scope.user.Username,$scope.user.Fullname,$scope.user.Pernr,$scope.user.Mplant,$scope.user.Wcentre);
        console.log("create userdetail:");
        console.log(userdetail);
        console.log("xcsrf_token: " + header_xcsrf_token);
        // POST to server
        $http({
                method: 'POST',
                url: url,
                data: userdetail,
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
                // succesful POST!
                var msg = 'User Details Updated!';
                var alertPopup = $ionicPopup.alert({
                    title: 'Success',
                    template: msg
                });
                alertPopup.then(function(res) {
                    $scope.menu.hide = false;
                    userDetailFactory.storeUserDetails(userdetail);
                });
            },function(e){
                //$scope.doc.mdocm = 'Error';
                //alert("error!: " + e.response);
                console.log(e);
                // parse xml error 
                console.log(e.data);
                if (window.DOMParser)
                {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(e.data, "text/xml");
                }
                else // Internet Explorer
                {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(e.data);
                }
                console.log(xmlDoc.getElementsByTagName("message"));
                if(xmlDoc.getElementsByTagName("message").length >= 2){
                    var msg = xmlDoc.getElementsByTagName("message")[1].childNodes[0].nodeValue;
                }else{
                    var msg = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                };
                
                //var msg = 'Error: ' + e.statusText;
                console.log(msg);
                var alertPopup = $ionicPopup.alert({
                    title: 'Error!',
                    template: msg
                });
                alertPopup.then(function(res) {
                    console.log('NOK');
                });
            });
    };
}])

// Operation details controller
.controller('OperationController', ['$scope','$state', function($scope, $state){
  /* JSON for POST time conf.  
  {
  "d" : {

        "__metadata" : {
          "id" : "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/TimeConfSet('')",
          "uri" : "http://110.174.118.24:8001/sap/opu/odata/sap/ZMPOINT4_SRV/TimeConfSet('')",
          "type" : "ZMPOINT4_SRV.TimeConf"
        },
        "Orderid" : "",
        "Operation" : "",
        "FinConf" : "",
        "Complete" : false,
        "PostgDate" : "\/Date(1481068800000)\/",
        "ConfText" : "",
        "ActWork" : "0.0",
        "UnWork" : "",
        "ExecStartDate" : "\/Date(1481068800000)\/",
        "ExecStartTime" : "PT00H00M00S",
        "ExecFinDate" : "\/Date(1481068800000)\/",
        "ExecFinTime" : "PT00H00M00S",
        "PersNo" : "00000000"
      }
} */
}])

// Favorites controller
.controller('FavoritesController', ['$scope','$ionicNavBarDelegate','login','favoriteFactory','$state',function($scope, $ionicNavBarDelegate, login, favoriteFactory, $state) {
    $ionicNavBarDelegate.showBackButton(true);
    $scope.shouldShowDelete = false;
    user = login.getUser();
    console.log('user: ' + user);
    if(user != null){
        //$scope.favorites = favoriteFactory.getFavorites(user);  
        favoriteFactory.getFavorites(user).then(function(data){
           $scope.measpoints = data; 
        });
        
    }else{
        //$scope.favorites = [];
        $scope.measpoints = {} ; 
    };
    console.log('favpoints from controller:');
    console.log($scope.measpoints);
    //$scope.measpoints = favoriteFactory.getMeasPoints(); 
    
    //console.log('fav:');
    //console.log($scope.favorites);
    //console.log('points:');
    //console.log($scope.measpoints);
    
    $scope.toggleDelete = function(){
        $scope.shouldShowDelete = !$scope.shouldShowDelete;
    };
    
    $scope.deleteFavorite = function(point,index){
        favoriteFactory.deleteFromFavorites(point,user,$scope.measpoints,index);
        $scope.shouldShowDelete = false;
        //$scope.measpoints.splice(index, 1);
    };
    
    // navigate to create screen
    $scope.goToCreateScreen = function(point,pttxt,psort){
        $state.go('app.create', { id_point: point,
                                  pttxt: pttxt,
                                  psort: psort
                                }); 
    };
    
}])

.filter('favoriteFilter', function () {
            return function (measpoints, favorites) {
                var out = [];
                //console.log('filter');
                //console.log(measpoints);
                //console.log(favorites);
                for (var i = 0; i < favorites.length; i++) {
                    for (var j = 0; j < measpoints.length; j++) {
                        if (measpoints[j].Point === String(favorites[i].point))
                            out.push(measpoints[j]);
                    }
                }
                //console.log('out:');
                //console.log(out);
                return out;

        }});


;