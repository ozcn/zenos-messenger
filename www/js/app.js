// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services',
'ngMessages', 'firebase', 'angular-md5', 'angularMoment', 
'starter.utils', 'starter.auth'
])

.run(function($ionicPlatform, Auth, $rootScope, $state, $ionicHistory, Users, Loading) {
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

  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    console.log(error);
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $state.go("sign-in");
    }
  });

  $rootScope.$on('$stateChangeSuccess',function(){
      Loading.hide();
   });

  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
    Loading.show("loading...");
    // console.log("stateChangeStart");
    if((toState.name === "sign-in" || toState.name === "sign-in-with-email" ) && $rootScope.currentUser){
      event.preventDefault();
    }
  });

  Auth.$onAuthStateChanged(function(currentUser) {

    // check user auth state
    if(currentUser){
      console.log(currentUser);
      Users.setOnline(currentUser.uid);

      // check if the user add to database
      Users.get(currentUser.uid).$loaded()
      .then(function(userRecord){
        $rootScope.currentUser = userRecord;

        if(!userRecord.name || !userRecord.face || !userRecord.provider){
          Users.updateProfile(userRecord, currentUser.providerData[0])
          .then(function(ref) {
            console.log("Success Saved:", ref.key);
          }, function(error) {
            console.log("Error:", error);
          });
        }
      });

      console.log("Log In");

    }
    else {
      // logout
      $rootScope.currentUser = 0;
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
      $state.go("sign-in");
      console.log("Log Out");
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // auth state
  .state('sign-in', {
    url: '/sign-in',
    cache: false,
    templateUrl: 'templates/auth/sign-in.html',
    controller: 'AuthCtrl',
    resolve: {
      // controller will not be loaded until $waitForSignIn resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "auth": ["Auth", function(Auth) {
        // $waitForSignIn returns a promise so the resolve waits for it to complete
        return Auth.$waitForSignIn();
      }]
    }
  })

  .state('sign-in-with-email', {
    url: '/sign-in-with-email',
    cache: false,
    templateUrl: 'templates/auth/sign-in-with-email.html',
    controller: 'AuthCtrl',
    resolve: {
      // controller will not be loaded until $waitForSignIn resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "auth": ["Auth", function(Auth) {
        // $waitForSignIn returns a promise so the resolve waits for it to complete
        return Auth.$waitForSignIn();
      }]
    }
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    resolve: {
      // controller will not be loaded until $requireSignIn resolves
      // Auth refers to our $firebaseAuth wrapper in the factory below
      "auth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $stateChangeError (see above)
        return Auth.$requireSignIn();
      }]
    }
  })

  // Each tab has its own nav history stack:
  // Tab Chats --------------------------------
  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl',
          resolve: {
            'activities': function(Activities, auth){
              return Activities.all(auth.uid).$loaded();
            }

          }

        }
      }
    })
  .state('tab.chat', {
    url: '/chats/:chatId',
    views: {
      'tab-chats': {
        templateUrl: 'templates/chat.html',
        controller: 'ChatCtrl',
        resolve: {
          'linkType': function(){
              return 'chats';
           },
          'chat': function(auth, Privates, Chats, $stateParams){

            return Chats.get($stateParams.chatId).$loaded(function(directChat){
              if(directChat.type){
                // navigation with chat id
                return directChat;
              }
              else{
                // use for new chat button on header bar
                // navigation to private chat
                // or create private chat relation
                return Privates.check(auth.uid, $stateParams.chatId).$loaded(function(privateChat){
                  if(privateChat.$value){
                    // navigation with user id
                    return Chats.get(privateChat.$value).$loaded();
                  }
                  else{
                    // add new private chat relation
                    return Chats.newPrivate(auth.uid, $stateParams.chatId);
                  }
                });
              }
            });

          },
          'messages': function(chat, Messages){
            return Messages.getMessages(chat.$id).$loaded();
          },
          'members': function(chat, Members){
            return Members.get(chat.$id).$loaded();
          },
          'currentWallets': function(auth, Wallets){
            return Wallets.all(auth.uid).$loaded(function(wallets){
              return wallets;
            });
          },
          'membersWallets': function(auth, members, Wallets){
            var targetUserId;
            members.some(function(member){
              if (member.$id !== auth.uid) {
                targetUserId = member.$id;
                return true;
              }
            });

            return Wallets.all(targetUserId).$loaded(function(wallets){
              return wallets;
            });
          },
          'activity': function(auth, chat, Activities, Users, $stateParams){
            return Activities.get(auth.uid, chat.$id).$loaded(function(activity){
              if(!activity.name){
                activity.name = Users.getName($stateParams.chatId);
              }
              return activity;
            });
          }
        }
      }

    }

  })
  .state('tab.chat-detail', {
    url: '/chats/:chatId/detail',
    views: {
      'tab-chats': {
        templateUrl: 'templates/chat-detail.html',
        controller: 'ChatDetailCtrl',
        resolve: {
          'activity': function(auth, $stateParams, Activities){
            return Activities.get(auth.uid, $stateParams.chatId).$loaded();
          },
          'members': function($stateParams, Members){
            return Members.get($stateParams.chatId).$loaded();
          }
        }

      }
    }
  })

  // Tab Groups --------------------------------
  .state('tab.groups', {
      url: '/groups',
      views: {
        'tab-groups': {
          templateUrl: 'templates/tab-groups.html',
          controller: 'GroupsCtrl',
          resolve: {
            'activities': function(Activities, auth){
              return Activities.group(auth.uid).$loaded();
            }
          }

        }
      }
    })
  .state('tab.group', {
    url: '/groups/:groupId',
    views: {
      'tab-groups': {
        templateUrl: 'templates/chat.html',
        controller: 'ChatCtrl',
        resolve: {
          'linkType': function(){
              return 'groups';
           },
          'chat': function(Chats, $stateParams){
            return Chats.get($stateParams.groupId).$loaded();
          },
          'messages': function($stateParams, Messages){
            return Messages.getMessages($stateParams.groupId).$loaded();
          },
          'members': function($stateParams, Members){
            return Members.get($stateParams.groupId).$loaded();
          },
          'activity': function(auth, $stateParams, Activities){
            return Activities.get(auth.uid, $stateParams.groupId).$loaded();
          }
        }
      }
    }
  })
  .state('tab.group-detail', {
    url: '/groups/:groupId/detail',
    views: {
      'tab-groups': {
        templateUrl: 'templates/chat-detail.html',
        controller: 'ChatDetailCtrl',
        resolve: {
          'activity': function(auth, $stateParams, Activities){
            return Activities.get(auth.uid, $stateParams.groupId).$loaded();
          },
          'members': function($stateParams, Members){
            return Members.get($stateParams.groupId).$loaded();
          }
        }
      }
    }

  })

  // Tab Contacts --------------------------------
  .state('tab.contacts', {
      url: '/contacts',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/tab-contacts.html',
          controller: 'ContactsCtrl',
          resolve: {
            'contacts': function(Users){
              return Users.all.$loaded();
            }
          }
        }
      }
    })
  .state('tab.contact', {
    url: '/contacts/:contactId',
    views: {
      'tab-contacts': {
        resolve: {
           'check': function(auth, Privates, Chats, $stateParams, $state){
             return Privates.check(auth.uid, $stateParams.contactId).$loaded(function(privateChat){

               // check if has creat private chat relation
               if(privateChat.$value){
                 // go
                 return $state.go("tab.chats").then(function(){
                   return $state.go("tab.chat",{chatId: privateChat.$value});
                 });
               }
               else{
                 // add new private chat relation
                //  then go
                 return Chats.newPrivate(auth.uid, $stateParams.contactId).then(function(chat){
                   return $state.go("tab.chats").then(function(){
                     return $state.go("tab.chat",{chatId: chat.$id});
                   });
                 });
               }
             });
           } // chat service end
        } // resolve end
      }
    }
  })

  // Tab Account --------------------------------
  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl',
        resolve: {
          'currentWallet': function(auth, Wallets){
            return Wallets.all(auth.uid).$loaded(function(wallets){
              if (wallets && wallets.length > 0) {
                // FIXME 2つ以上ある場合、決め打ちで最初の要素を current として利用している
                return wallets[0];
              } else {
                return {};
              }
            });
          }
        }
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/chats');

});
