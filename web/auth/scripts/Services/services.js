Sandy.service("MsgService", function($rootScope) {
  
  clearValid = this.clearValid = function () {
    $rootScope.messageValid = "";
    $rootScope.apply();
  }

  clearError = this.clearError = function() {
    $rootScope.messagesError = "";
  }

  this.valid = function(message, ttl) {
    $rootScope.messageValid = message;
    if ( ttl ) 
      setTimeout(function() {
        clearValid();

      }, ttl * 1000 );
  }

  this.error = function ( message, ttl ) {
    $rootScope.messagesError = message;
    if ( ttl ) 
      setTimeout(function() {
        clearError();
      }, ttl);
  }
});

Sandy.service("TableService", function($rootScope) {
  
  dataTableCzech = {
    "sProcessing":   "Provádím...",
      "sLengthMenu":   "Zobraz záznamů _MENU_",
      "sZeroRecords":  "Žádné záznamy nebyly nalezeny",
      "sInfo":         "Zobrazuji _START_ až _END_ z celkem _TOTAL_ záznamů",
      "sInfoEmpty":    "Zobrazuji 0 až 0 z 0 záznamů",
      "sInfoFiltered": "(filtrováno z celkem _MAX_ záznamů)",
      "sInfoPostFix":  "",
      "sSearch":       "Hledat:",
      "sUrl":          "",
      "oPaginate": {
         "sFirst":    "První",
         "sPrevious": "Předchozí",
         "sNext":     "Další",
         "sLast":     "Poslední"
     }
  };

  this.show = function ( id ) {

    setTimeout ( function () {
      
      $('#'+id).dataTable({
        "oLanguage": dataTableCzech,
            "bPaginate": true,
            "bLengthChange": false,
            "bFilter": false,
            "bSort": true,
            "bInfo": true,
            "bAutoWidth": false
        });
    }, 200);
  }
});

Sandy.filter('dateToISO', function() {
  return function(input) {
    alert ( input );

    input = new Date(input).toISOString();
    return input;
  };
});

Sandy.service("errorService", function($rootScope, $http) {

var brokerUrl = CONF.url+":"+CONF.port+"/client-rest/";
  var self = this;
  self.stopRequests = false;
  self.ignoreError404 = false;
  self.pingInt = false;
  self.logoutStop = false;

  this.readUserInfo = function () {
      
      $http({ url: brokerUrl+"account-info", method: 'GET' }).success(function ( data ) {

          self.testResult ( function () {

            $rootScope.userInfo = data;
            $rootScope.socket.socket.reconnect();
          }, data);
      });
  }
  this.showError = function ( loc, data, status, headers, config, $location) {
    
    if ( self.stopRequests )
      return false;

    // stop all requests
    self.stopRequests = true;
    setTimeout ( function() {

      // fade out page 
      $("#connError").fadeIn();
      $(".overlay_all").fadeIn();
      
      // // start pinging server
      self.pingInt = setInterval (function() {

        $http({ url: brokerUrl+"ping", method: 'GET' })
            .success(function(data, status, headers, config){

              // fade in page
              self.stopRequests = false;            
              clearInterval( self.pingInt );

              self.readUserInfo ();

              $("#connError").fadeOut();
              $(".overlay_all").fadeOut();

            }).error(function(data, status, headers, config){

              console.log ( "HTTP ERROR: "+ status );
            });
      }, 1000 );
        
    }, 500 );
  }
  
  this.testResult = function( cb, data, status, headers, config ) {

    if ( data.unauthenticated == 1 ) {

      if ( self.stopRequests )
        return false;
      
      self.stopRequests = true;
      alert ( "Došlo k odhlášení. Prosím přihlašte se znovu." );
      window.location = "/logout";

    }
    else if ( cb )
      cb ( data, status, headers, config );
  }
});

Sandy.factory('restCall', function ($http, $rootScope, errorService) {

  var brokerUrl = CONF.url+":"+CONF.port+"/client-rest/";

  return{          
    get: function( loc, cb ) {

      if ( errorService.stopRequests )
        return false;

      return $http({ url: brokerUrl+loc, method: 'GET' })
        .success(function(data, status, headers, config){

          errorService.testResult ( cb, data, status, headers, config );

        }).error(function(data, status, headers, config){

          errorService.showError ( brokerUrl+loc, data, status, headers, config);
        });
    },
    post: function ( loc, data, cb ) {

      if ( errorService.stopRequests )
        return false;

      $http({ url: brokerUrl+loc, method: "POST", data: data })
        .success(function(data, status, headers, config) {
          
            errorService.testResult ( cb, data, status, headers, config );
        
        }).error(function(data, status, headers, config) {
          
            errorService.showError ( brokerUrl+loc, data, status, headers, config);
        });
    }
  }
});

Sandy.run(function($rootScope) {

  $rootScope.orderTypes = { 
    0:"sell order", 
    1:"buy order", 
    100: "sell executed",
    101: "buy executed", 
    200: "sell cancel",
    201: "buy cancel",
    300: "sell cancelled",
    301: "buy cancelled",
    400: "sell expired",
    401: "buy expired",
  }

  $rootScope.orderTypesBig = { 
    0:"SELL ORDER", 
    1:"BUY ORDER", 
    100: "SELL EXECUTED",
    101: "BUY EXECUTED", 
    200: "SELL CANCEL",
    201: "BUY CANCEL",
    300: "SELL CANCELLED",
    301: "BUY CANCELLED",
    400: "SELL EXPIRED",
    401: "BUY EXPIRED",

  }

  
  $rootScope.$on('$routeChangeStart', function() {

    $("#content_box").hide();
  });
 
  $rootScope.$on('$routeChangeSuccess', function() {

    addr = window.location.pathname;
    $(".sidebar-menu li a[ng-href$='"+addr+"']").click();
    
    setTimeout ( function () {

      $("#content_box").fadeIn(500);
    }, 400);
  });

  $(".sidebar-menu li a").click(function(el) {

    $(".active").removeClass("active");
    $(this).parent().addClass("active");
  });
});

Sandy.run(function($rootScope, socket, restCall) {
  $rootScope.newMessagesCount = 0;

  // nacti zakladni informace o klientovi
  restCall.get( "account-info",  function ( res ) {

    $rootScope.userInfo = res;
  });
});


Sandy.filter('replace', function () {

  return function(text, f, t){

    return text.replace(f,t);
  } 
});


Sandy.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});