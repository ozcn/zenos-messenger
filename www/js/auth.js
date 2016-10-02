angular.module('starter.auth', [])
.factory('Auth', function( $firebaseAuth ){
  return $firebaseAuth();
})
.controller('AuthCtrl', function($scope, Loading, Error, ModalService, $state, Auth, Users) {
  $scope.signIn = function (provider){
    Loading.show("Sign in with " + provider + "...");

    Auth.$signInWithPopup(provider).then(function(result) {
      console.log("Signed in as:", result.user.uid);
      $state.go("tab.chats");
      Loading.hide();
    }).catch(function(error) {
      console.error("Authentication failed:", error);
      Loading.hide();
      Error(error.code, error.message);
    });
  }

  $scope.signInWithEmail = function (user) {
    if(angular.isDefined(user)){
      Loading.show("Sign in...");

      Auth.$signInWithEmailAndPassword(user.email, user.password)
      .then(function(currentUser) {
        console.log("Signed in as:", currentUser.uid);
        $state.go("tab.chats");
        Loading.hide();
      }).catch(function(error) {
        Loading.hide();
        console.error("Authentication failed:", error);
        Error(error.code, error.message);
      });
    }
  };

  $scope.signUpWithEmail = function(user) {
    if(angular.isDefined(user)){
      Loading.show("Sign up...");
      Auth.$createUserWithEmailAndPassword(user.email, user.password)
        .then(function(currentUser) {
          console.log(user);
          Users.setEmailUser(currentUser.uid, user.displayName, user.email).then(function(){
            console.log("User created with uid: " + currentUser.uid);
            $scope.closeModal();
            $state.go("tab.chats");
            Loading.hide();
          });
        }).catch(function(error) {
          Loading.hide();
          console.log(error);
          Error(error.code, error.message);
        });
    }
  };

  $scope.sendPasswordResetEmail = function(email){
    if(angular.isDefined(email)){
        Loading.show("Sending...");
        Auth.$sendPasswordResetEmail(email).then(function() {
          console.log("Password reset email sent successfully!");
          $scope.closePassword();
          $state.go("tab.chats");
          Loading.hide();
        }).catch(function(error) {
          console.error("Error: ", error);
          Loading.hide();
          Error(error.code, error.message);
        });
      }
  }

  $scope.newSignup = function() {
    ModalService
      .init('templates/auth/sign-up.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.newPassword = function() {
    ModalService
      .init('templates/auth/forgot-password.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

});
