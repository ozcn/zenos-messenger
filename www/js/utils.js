angular.module('starter.utils', [])
.factory('Loading', function( $ionicLoading ){
  var Loading = {
    show: function(loadingText){
      return $ionicLoading.show({
        template: '<div><ion-spinner class="spinner-light" icon="lines"/></div><div style="max-width:140px;">' + loadingText + '</div>',
        duration: 2000
      })
      .then(function(){
        console.log("The loading indicator is now displayed");
      });
    },
    hide: function(){
      return $ionicLoading.hide()
      .then(function(){
        console.log("The loading indicator is now hidden");
      });
    }
  }
  return Loading;
})
.factory('Error', function( $ionicPopup ){
  var Error = function(tit,msg){
		var alertPopup = $ionicPopup.alert({
			title: tit,
			template: msg
		});
		alertPopup.then(function(res) {
		});
  };
  return Error;
})
.service('ModalService', function($ionicModal, $rootScope) {
  var init = function(tpl, $scope) {

    var promise;
    $scope = $scope || $rootScope.$new();

    promise = $ionicModal.fromTemplateUrl(tpl, {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.$on('$ionicView.beforeLeave', function(e) {
        $scope.closeModal();
      });
      return modal;
    });

    $scope.openModal = function() {
       $scope.modal.show();
     };
     $scope.closeModal = function() {
       $scope.modal.hide();
     };
     $scope.$on('$destroy', function() {
       $scope.modal.remove();
     });

    return promise;
  }

  return {
    init: init
  }
})

.directive('hideTabs', function($rootScope, $ionicTabsDelegate) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.beforeEnter", function () {
        $ionicTabsDelegate.showBar(false);
      });
    }
  };
})

.directive('showTabs', function($rootScope, $ionicTabsDelegate) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.beforeEnter", function () {
        $ionicTabsDelegate.showBar(true);
      });
    }
  };
})

.filter('split', function() {
    return function(input) {
        if(input){
          return input.split(', ');
        }
        return null;
    }
});
